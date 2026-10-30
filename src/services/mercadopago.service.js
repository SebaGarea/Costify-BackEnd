import {
  CuentaDineroModel,
  CategoriaMovimientoModel,
  MovimientoModel,
  IntegracionMercadoPagoModel,
} from "../dao/models/index.js";
import {
  aFechaMovimiento,
  asegurarDatosIniciales,
  getCategoriaSistema,
} from "./caja.service.js";
import { createHmac, timingSafeEqual } from "crypto";
import logger from "../config/logger.js";

// Importa a la Caja los movimientos de la cuenta de Mercado Pago del negocio.
//
// - Lo que ENTRA (cobros, ventas de Mercado Libre, transferencias recibidas) se
//   registra como ingreso bruto + un egreso "Comisiones" por lo que retuvo MP/ML.
// - Lo que SALE del saldo (pagos y transferencias con dinero en cuenta) se
//   registra como egreso. Lo pagado con tarjeta no toca el saldo de MP: se omite.
// - Las cargas de saldo propias (account_fund) son un ajuste, no un ingreso.
// - Si una operación ya importada se devuelve, se registra el movimiento inverso.
//
// Cada operación se identifica por (mpPaymentId, mpTipo): nunca se importa dos veces.

const API = "https://api.mercadopago.com";
const INTERVALO_MS = 60 * 1000;
const POR_PAGINA = 100;
const MAX_PAGINAS = 50;

const token = () => (process.env.MP_ACCESS_TOKEN || "").trim();
const webhookSecret = () => (process.env.MP_WEBHOOK_SECRET || "").trim();

// Espera antes de sincronizar tras un webhook: la búsqueda de pagos de MP puede
// tardar unos segundos en mostrar la operación recién avisada.
const DEMORA_WEBHOOK_MS = 3000;

// Verifica la firma de un webhook de Mercado Pago (header x-signature).
// Manifest: "id:<data.id>;request-id:<x-request-id>;ts:<ts>;" firmado con HMAC-SHA256.
// Si falta algún valor, esa parte se omite (así lo indica la documentación de MP).
export const verificarFirmaWebhook = ({ xSignature, xRequestId, dataId }) => {
  const secret = webhookSecret();
  if (!secret || !xSignature) return false;
  const partes = Object.fromEntries(
    String(xSignature)
      .split(",")
      .map((p) => p.split("=").map((x) => x.trim()))
      .filter(([k, v]) => k && v)
  );
  if (!partes.ts || !partes.v1) return false;
  const id = dataId ? String(dataId) : "";
  const idManifest = /^[a-z0-9]+$/i.test(id) ? id.toLowerCase() : id;
  let manifest = "";
  if (idManifest) manifest += `id:${idManifest};`;
  if (xRequestId) manifest += `request-id:${xRequestId};`;
  manifest += `ts:${partes.ts};`;
  const esperado = createHmac("sha256", secret).update(manifest).digest("hex");
  const a = Buffer.from(esperado, "hex");
  const b = Buffer.from(String(partes.v1), "hex");
  return a.length === b.length && timingSafeEqual(a, b);
};
export const mercadoPagoHabilitado = () => Boolean(token());

const redondear = (n) => Math.round((Number(n) || 0) * 100) / 100;

const mpGet = async (path, params = {}) => {
  const url = new URL(path, API);
  Object.entries(params).forEach(([k, v]) => v !== undefined && url.searchParams.set(k, String(v)));
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token()}` },
      signal: ctrl.signal,
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const error = new Error(`Mercado Pago respondió ${res.status}: ${body?.message || body?.error || "error"}`);
      error.status = 502;
      throw error;
    }
    return body;
  } finally {
    clearTimeout(timer);
  }
};

const getEstado = async () =>
  IntegracionMercadoPagoModel.findOneAndUpdate(
    { key: "mercadopago" },
    { $setOnInsert: { key: "mercadopago" } },
    { upsert: true, new: true }
  ).lean();

// Inicio del día (hora Argentina) de una fecha guardada al mediodía UTC.
const inicioDiaAR = (fecha) => `${new Date(fecha).toISOString().slice(0, 10)}T00:00:00.000-03:00`;

const fechaLiberacion = (p) => {
  if (p.money_release_status === "released" || !p.money_release_date) return null;
  const d = new Date(p.money_release_date);
  return d > new Date() ? d : null;
};

const describir = (p, entra) =>
  (p.description || "").trim() ||
  (entra ? "Cobro Mercado Pago" : "Pago Mercado Pago");

class MercadoPagoService {
  constructor() {
    this.enCurso = null;
    this.timer = null;
    this.programada = null;
    this.repetir = false;
  }

  async estado() {
    const estado = await getEstado();
    const cuenta = await CuentaDineroModel.findOne({ integracion: "mercadopago" }).lean();
    return {
      habilitado: mercadoPagoHabilitado(),
      cuentaId: cuenta ? String(cuenta._id) : null,
      cuentaNombre: cuenta?.nombre ?? null,
      desde: cuenta?.fechaSaldoInicial ?? null,
      nickname: estado.nickname,
      ultimaSync: estado.ultimaSync,
      ultimoError: estado.ultimoError,
      importados: estado.importados,
    };
  }

  // Aviso de un webhook: sincroniza en unos segundos. Si ya hay una
  // sincronización en curso, se repite al terminar (para no perder el aviso).
  solicitarSincronizacion() {
    if (!mercadoPagoHabilitado()) return;
    if (this.enCurso) {
      this.repetir = true;
      return;
    }
    if (this.programada) return;
    this.programada = setTimeout(() => {
      this.programada = null;
      this.sincronizar()
        .catch(() => {})
        .finally(() => {
          if (this.repetir) {
            this.repetir = false;
            this.solicitarSincronizacion();
          }
        });
    }, DEMORA_WEBHOOK_MS);
  }

  // Evita dos sincronizaciones a la vez (botón + intervalo).
  sincronizar() {
    if (!mercadoPagoHabilitado()) {
      const error = new Error("Mercado Pago no está configurado (falta MP_ACCESS_TOKEN)");
      error.status = 400;
      return Promise.reject(error);
    }
    if (!this.enCurso) {
      this.enCurso = this.ejecutar().finally(() => {
        this.enCurso = null;
      });
    }
    return this.enCurso;
  }

  async ejecutar() {
    try {
      const resultado = await this.importar();
      await IntegracionMercadoPagoModel.updateOne(
        { key: "mercadopago" },
        {
          $set: { ultimaSync: new Date(), ultimoError: null },
          $inc: { importados: resultado.nuevos },
        }
      );
      if (resultado.nuevos || resultado.vinculados || resultado.devoluciones) {
        logger.info("Mercado Pago sincronizado", resultado);
      }
      return resultado;
    } catch (error) {
      await IntegracionMercadoPagoModel.updateOne(
        { key: "mercadopago" },
        { $set: { ultimoError: error.message } },
        { upsert: true }
      ).catch(() => {});
      logger.error("Error al sincronizar Mercado Pago", { message: error.message });
      throw error;
    }
  }

  async importar() {
    await asegurarDatosIniciales();
    const cuenta = await CuentaDineroModel.findOne({ integracion: "mercadopago" }).lean();
    if (!cuenta) {
      const error = new Error("No hay una cuenta de Caja conectada a Mercado Pago");
      error.status = 400;
      throw error;
    }

    const estado = await getEstado();
    const yo = await mpGet("/users/me");
    const miId = String(yo.id);
    if (estado.userId !== miId) {
      await IntegracionMercadoPagoModel.updateOne(
        { key: "mercadopago" },
        { $set: { userId: miId, nickname: yo.nickname || null } }
      );
    }

    // Primera vez: todo lo creado desde el saldo inicial de la cuenta.
    // Después: lo actualizado en los últimos días (así se detectan devoluciones).
    const desde = new Date(cuenta.fechaSaldoInicial);
    const primeraVez = !estado.ultimaSync;
    const range = primeraVez ? "date_created" : "date_last_updated";
    const beginDate = primeraVez
      ? inicioDiaAR(desde)
      : new Date(Math.max(desde.getTime(), new Date(estado.ultimaSync).getTime() - 3 * 86400000)).toISOString();

    const [catVentas, catComisiones, catOtrosGastos, catOtrosIngresos] = await Promise.all([
      getCategoriaSistema("ventas"),
      getCategoriaSistema("comisiones"),
      getCategoriaSistema("otros_gastos"),
      CategoriaMovimientoModel.findOne({ tipo: "ingreso", nombre: /^otros ingresos$/i }).lean(),
    ]);
    const ignorados = new Set(estado.ignorados || []);
    const categoriaAprendida = new Map();

    const resultado = { revisados: 0, nuevos: 0, vinculados: 0, devoluciones: 0, omitidosTarjeta: 0 };

    // Categoría que el usuario ya le puso antes a un gasto con la misma descripción.
    const categoriaPara = async (descripcion) => {
      const clave = descripcion.toLowerCase();
      if (!categoriaAprendida.has(clave)) {
        const previo = await MovimientoModel.findOne({
          tipo: "egreso",
          descripcion: new RegExp(`^${descripcion.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
          categoria: { $nin: [null, catOtrosGastos?._id] },
        })
          .sort({ updatedAt: -1 })
          .lean();
        categoriaAprendida.set(clave, previo?.categoria ?? catOtrosGastos?._id ?? null);
      }
      return categoriaAprendida.get(clave);
    };

    const existe = async (id, tipo) =>
      ignorados.has(`${id}:${tipo}`) ||
      Boolean(await MovimientoModel.exists({ "origen.mpPaymentId": id, "origen.mpTipo": tipo }));

    const crear = async (doc) => {
      try {
        await MovimientoModel.create({ cuenta: cuenta._id, ...doc });
        return true;
      } catch (error) {
        if (error?.code === 11000) return false; // ya importado (carrera)
        throw error;
      }
    };

    for (let pagina = 0; pagina < MAX_PAGINAS; pagina += 1) {
      const data = await mpGet("/v1/payments/search", {
        sort: "date_created",
        criteria: "asc",
        range,
        begin_date: beginDate,
        end_date: new Date().toISOString(),
        limit: POR_PAGINA,
        offset: pagina * POR_PAGINA,
      });
      const pagos = Array.isArray(data.results) ? data.results : [];

      for (const p of pagos) {
        resultado.revisados += 1;
        const id = String(p.id);
        const fueAprobado = Boolean(p.date_approved) && ["approved", "refunded", "charged_back", "in_mediation"].includes(p.status);
        if (!fueAprobado) continue;
        if (new Date(p.date_created) < new Date(inicioDiaAR(desde))) continue;

        const entra = String(p.collector_id) === miId;
        const fecha = aFechaMovimiento(p.date_approved || p.date_created);
        const descripcion = describir(p, entra);
        const devuelto = ["refunded", "charged_back"].includes(p.status);

        if (entra && p.operation_type === "account_fund") {
          // Carga de saldo propia (por ejemplo, desde la tarjeta): no es un ingreso.
          if (!(await existe(id, "carga"))) {
            if (await crear({
              tipo: "ajuste",
              direccion: "+",
              monto: redondear(p.transaction_amount),
              fecha,
              descripcion: "Carga de saldo en Mercado Pago",
              origen: { tipo: "mercadopago", mpPaymentId: id, mpTipo: "carga" },
            })) resultado.nuevos += 1;
          }
          continue;
        }

        if (entra) {
          const bruto = redondear(p.transaction_amount);
          const neto = redondear(p.transaction_details?.net_received_amount ?? bruto);
          const comision = redondear(bruto - neto);
          const liberacion = fechaLiberacion(p);

          if (!(await existe(id, "cobro"))) {
            if (await crear({
              tipo: "ingreso",
              monto: bruto,
              fecha,
              categoria: catVentas?._id ?? null,
              descripcion,
              liberacion,
              origen: { tipo: "mercadopago", mpPaymentId: id, mpTipo: "cobro" },
            })) {
              resultado.nuevos += 1;
            }
          }

          if (comision > 0.009 && !(await existe(id, "comision"))) {
            if (await crear({
              tipo: "egreso",
              monto: comision,
              fecha,
              categoria: catComisiones?._id ?? null,
              descripcion: `Comisión MP/ML: ${descripcion}`,
              liberacion,
              origen: { tipo: "mercadopago", mpPaymentId: id, mpTipo: "comision" },
            })) resultado.nuevos += 1;
          }

          if (devuelto && !(await existe(id, "devolucion"))) {
            if (await crear({
              tipo: "egreso",
              monto: neto,
              fecha: aFechaMovimiento(p.date_last_updated),
              categoria: catOtrosGastos?._id ?? null,
              descripcion: `Devolución: ${descripcion}`,
              origen: { tipo: "mercadopago", mpPaymentId: id, mpTipo: "devolucion" },
            })) resultado.devoluciones += 1;
          }
          continue;
        }

        // Sale: solo lo pagado con el saldo de la cuenta lo descuenta.
        if (p.payment_type_id !== "account_money") {
          resultado.omitidosTarjeta += 1;
          continue;
        }
        const monto = redondear(p.transaction_details?.total_paid_amount ?? p.transaction_amount);
        if (!(await existe(id, "pago"))) {
          if (await crear({
            tipo: "egreso",
            monto,
            fecha,
            categoria: await categoriaPara(descripcion),
            descripcion,
            origen: { tipo: "mercadopago", mpPaymentId: id, mpTipo: "pago" },
          })) resultado.nuevos += 1;
        }
        if (devuelto && !(await existe(id, "devolucion"))) {
          if (await crear({
            tipo: "ingreso",
            monto,
            fecha: aFechaMovimiento(p.date_last_updated),
            categoria: catOtrosIngresos?._id ?? null,
            descripcion: `Devolución: ${descripcion}`,
            origen: { tipo: "mercadopago", mpPaymentId: id, mpTipo: "devolucion" },
          })) resultado.devoluciones += 1;
        }
      }

      const total = data.paging?.total ?? 0;
      if (pagos.length < POR_PAGINA || (pagina + 1) * POR_PAGINA >= total) break;
    }

    return resultado;
  }

  // Sincroniza al arrancar (con un pequeño retraso) y cada minuto.
  iniciarSincronizacionPeriodica() {
    if (!mercadoPagoHabilitado() || this.timer) return;
    const correr = () => this.sincronizar().catch(() => {});
    setTimeout(correr, 30 * 1000).unref?.();
    this.timer = setInterval(correr, INTERVALO_MS);
    this.timer.unref?.();
    logger.info("Sincronización con Mercado Pago activada (cada 1 minuto)");
  }
}

export const mercadoPagoService = new MercadoPagoService();
