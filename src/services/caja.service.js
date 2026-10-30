import mongoose from "mongoose";
import {
  CuentaDineroModel,
  CategoriaMovimientoModel,
  MovimientoModel,
  IntegracionMercadoPagoModel,
} from "../dao/models/index.js";
import { ConfiguracionModel } from "../dao/models/ConfiguracionSchema.js";
import logger from "../config/logger.js";

const TZ = "America/Argentina/Buenos_Aires";

// ---------- Fechas ----------
// Igual que el resto de la app: las fechas "de día" se guardan al mediodía UTC
// para que nunca caigan en el día anterior/siguiente por la zona horaria.
const fechaLocalAR = (date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(date); // YYYY-MM-DD

const mediodiaUTC = (yyyyMmDd) => new Date(`${yyyyMmDd}T12:00:00.000Z`);

export const aFechaMovimiento = (valor) => {
  if (!valor) return mediodiaUTC(fechaLocalAR());
  const str = String(valor);
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return mediodiaUTC(str);
  const parsed = new Date(str);
  if (Number.isNaN(parsed.getTime())) return mediodiaUTC(fechaLocalAR());
  return mediodiaUTC(fechaLocalAR(parsed));
};

const inicioDia = (yyyyMmDd) => new Date(`${yyyyMmDd}T00:00:00.000Z`);
const finDia = (yyyyMmDd) => new Date(`${yyyyMmDd}T23:59:59.999Z`);

const rangoMesActual = () => {
  const hoy = fechaLocalAR();
  const [y, m] = hoy.split("-").map(Number);
  const ultimo = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const mm = String(m).padStart(2, "0");
  return { desde: `${y}-${mm}-01`, hasta: `${y}-${mm}-${String(ultimo).padStart(2, "0")}` };
};

const esFechaISO = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v || ""));

// ---------- Utilidades ----------
const redondear = (n) => Math.round((Number(n) || 0) * 100) / 100;
const toId = (v) => (v ? String(v._id ?? v) : null);
const esObjectId = (v) => mongoose.isValidObjectId(v);

const crearError = (message, status = 400) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

// ---------- Datos iniciales ----------
const CUENTAS_INICIALES = [
  { nombre: "Efectivo", tipo: "efectivo", esDigital: false, color: "green", orden: 0 },
  { nombre: "Mercado Pago", tipo: "billetera", esDigital: true, color: "blue", orden: 1 },
  { nombre: "Naranja X", tipo: "billetera", esDigital: true, color: "orange", orden: 2 },
];

const CATEGORIAS_INICIALES = [
  { nombre: "Ventas", tipo: "ingreso", color: "green", sistema: true, clave: "ventas" },
  { nombre: "Otros ingresos", tipo: "ingreso", color: "teal" },
  { nombre: "Materiales", tipo: "egreso", color: "orange", sistema: true, clave: "materiales" },
  { nombre: "Pintura", tipo: "egreso", color: "purple" },
  { nombre: "Herramientas", tipo: "egreso", color: "cyan" },
  { nombre: "Flete / Combustible", tipo: "egreso", color: "yellow" },
  { nombre: "Servicios", tipo: "egreso", color: "blue" },
  { nombre: "Alquiler", tipo: "egreso", color: "pink" },
  { nombre: "Mano de obra", tipo: "egreso", color: "red" },
  { nombre: "Impuestos", tipo: "egreso", color: "gray" },
  { nombre: "Comisiones", tipo: "egreso", color: "teal", sistema: true, clave: "comisiones" },
  { nombre: "Retiros personales", tipo: "egreso", color: "purple" },
  { nombre: "Otros gastos", tipo: "egreso", color: "gray", sistema: true, clave: "otros_gastos" },
];

let inicializacion = null;

const inicializar = async () => {
  if ((await CuentaDineroModel.estimatedDocumentCount()) === 0) {
    await CuentaDineroModel.insertMany(
      CUENTAS_INICIALES.map((c) => ({ ...c, fechaSaldoInicial: mediodiaUTC(fechaLocalAR()) }))
    );
  }

  if ((await CategoriaMovimientoModel.estimatedDocumentCount()) === 0) {
    await CategoriaMovimientoModel.insertMany(CATEGORIAS_INICIALES);
  } else {
    // Las de sistema tienen que existir siempre (las usan los cobros, las compras
    // y la importación de Mercado Pago). Si ya hay una con el mismo nombre, se reutiliza.
    for (const cat of CATEGORIAS_INICIALES.filter((c) => c.sistema)) {
      if (await CategoriaMovimientoModel.exists({ clave: cat.clave })) continue;
      const existente = await CategoriaMovimientoModel.findOneAndUpdate(
        { nombre: cat.nombre, tipo: cat.tipo, clave: null },
        { $set: { clave: cat.clave, sistema: true, activa: true } }
      );
      if (!existente) await CategoriaMovimientoModel.create(cat);
    }
  }

  // La cuenta "Mercado Pago" queda conectada a la importación automática.
  if (!(await CuentaDineroModel.exists({ integracion: "mercadopago" }))) {
    await CuentaDineroModel.findOneAndUpdate(
      { nombre: { $regex: /^mercado\s*pago$/i } },
      { $set: { integracion: "mercadopago" } }
    );
  }

  const config = await ConfiguracionModel.findOne().lean();
  if (!config?.cuentaCobroDefault) {
    const mp = await CuentaDineroModel.findOne({ nombre: "Mercado Pago" }).lean();
    const cuenta = mp || (await CuentaDineroModel.findOne({ activa: true }).sort({ orden: 1 }).lean());
    if (cuenta) {
      await ConfiguracionModel.findOneAndUpdate(
        {},
        { $set: { cuentaCobroDefault: cuenta._id } },
        { upsert: true }
      );
    }
  }
};

export const asegurarDatosIniciales = async () => {
  if (!inicializacion) {
    inicializacion = inicializar().catch((error) => {
      inicializacion = null;
      throw error;
    });
  }
  return inicializacion;
};

export const getCategoriaSistema = async (clave) => {
  await asegurarDatosIniciales();
  return CategoriaMovimientoModel.findOne({ clave }).lean();
};

// ---------- Saldos ----------
// Cada movimiento se convierte en uno o dos "deltas" por cuenta. Solo cuentan
// los movimientos desde la fecha del saldo inicial de cada cuenta.
const pipelineDeltas = () => [
  {
    $project: {
      fecha: 1,
      deltas: {
        $cond: [
          { $eq: ["$tipo", "transferencia"] },
          [
            { c: "$cuenta", d: { $multiply: ["$monto", -1] } },
            { c: "$cuentaDestino", d: "$monto" },
          ],
          [
            {
              c: "$cuenta",
              d: {
                $switch: {
                  branches: [
                    { case: { $eq: ["$tipo", "ingreso"] }, then: "$monto" },
                    { case: { $eq: ["$tipo", "egreso"] }, then: { $multiply: ["$monto", -1] } },
                    { case: { $eq: ["$direccion", "-"] }, then: { $multiply: ["$monto", -1] } },
                  ],
                  default: "$monto",
                },
              },
            },
          ],
        ],
      },
    },
  },
  { $unwind: "$deltas" },
  {
    $lookup: {
      from: CuentaDineroModel.collection.name,
      localField: "deltas.c",
      foreignField: "_id",
      as: "cta",
    },
  },
  { $unwind: "$cta" },
  { $match: { $expr: { $gte: ["$fecha", "$cta.fechaSaldoInicial"] } } },
  { $group: { _id: "$deltas.c", total: { $sum: "$deltas.d" } } },
];

const calcularMovimientosPorCuenta = async () => {
  const filas = await MovimientoModel.aggregate(pipelineDeltas());
  return new Map(filas.map((f) => [String(f._id), f.total]));
};

// Plata de Mercado Pago cobrada pero todavía no liberada (neto de comisiones).
const calcularALiberar = async () => {
  const filas = await MovimientoModel.aggregate([
    { $match: { liberacion: { $gt: new Date() }, tipo: { $in: ["ingreso", "egreso"] } } },
    {
      $group: {
        _id: "$cuenta",
        total: { $sum: { $cond: [{ $eq: ["$tipo", "ingreso"] }, "$monto", { $multiply: ["$monto", -1] }] } },
      },
    },
  ]);
  return new Map(filas.map((f) => [String(f._id), f.total]));
};

const conSaldo = (cuenta, deltas) => ({
  ...cuenta,
  saldo: redondear(Number(cuenta.saldoInicial || 0) + (deltas.get(String(cuenta._id)) || 0)),
});

const DIEZ_DIAS = 10 * 24 * 60 * 60 * 1000;

const rangoFechas = (fecha) => ({
  $gte: new Date(fecha.getTime() - DIEZ_DIAS),
  $lte: new Date(fecha.getTime() + DIEZ_DIAS),
});

// Cobro importado de Mercado Pago, sin venta vinculada, por ese monto y cerca de esa fecha.
const buscarCobroMPSinVenta = (cuentaId, monto, fecha) =>
  MovimientoModel.findOne({
    cuenta: cuentaId,
    tipo: "ingreso",
    "origen.tipo": "mercadopago",
    "origen.mpTipo": "cobro",
    "origen.venta": null,
    monto: { $gte: monto - 0.5, $lte: monto + 0.5 },
    fecha: rangoFechas(fecha),
  })
    .sort({ fecha: -1 })
    .lean();

// Cobro de una venta registrado en la cuenta de Mercado Pago que todavía no se
// asoció a ninguna operación de MP (para no duplicarlo al importar).
export const buscarCobroVentaSinMP = (cuentaId, monto, fecha) =>
  MovimientoModel.findOne({
    cuenta: cuentaId,
    tipo: "ingreso",
    "origen.tipo": "venta",
    "origen.mpPaymentId": { $exists: false },
    monto: { $gte: monto - 0.5, $lte: monto + 0.5 },
    fecha: rangoFechas(fecha),
  })
    .sort({ fecha: 1 })
    .lean();

class CajaService {
  // ---------- Cuentas ----------
  async listarCuentas({ incluirArchivadas = false } = {}) {
    await asegurarDatosIniciales();
    const filtro = incluirArchivadas ? {} : { activa: true };
    const [cuentas, deltas, config] = await Promise.all([
      CuentaDineroModel.find(filtro).sort({ orden: 1, createdAt: 1 }).lean(),
      calcularMovimientosPorCuenta(),
      ConfiguracionModel.findOne().lean(),
    ]);
    const aLiberar = await calcularALiberar();
    const conSaldos = cuentas.map((c) => ({
      ...conSaldo(c, deltas),
      aLiberar: redondear(aLiberar.get(String(c._id)) || 0),
    }));
    const activas = conSaldos.filter((c) => c.activa);
    return {
      cuentas: conSaldos,
      cuentaCobroDefault: toId(config?.cuentaCobroDefault),
      totales: {
        total: redondear(activas.reduce((acc, c) => acc + c.saldo, 0)),
        efectivo: redondear(activas.filter((c) => !c.esDigital).reduce((acc, c) => acc + c.saldo, 0)),
        digital: redondear(activas.filter((c) => c.esDigital).reduce((acc, c) => acc + c.saldo, 0)),
      },
    };
  }

  async crearCuenta(data = {}) {
    await asegurarDatosIniciales();
    const nombre = String(data.nombre || "").trim();
    if (!nombre) throw crearError("El nombre de la cuenta es obligatorio");
    const tipo = ["efectivo", "billetera", "banco"].includes(data.tipo) ? data.tipo : "billetera";
    const orden = await CuentaDineroModel.countDocuments();
    return CuentaDineroModel.create({
      nombre,
      tipo,
      esDigital: data.esDigital !== undefined ? Boolean(data.esDigital) : tipo !== "efectivo",
      saldoInicial: redondear(data.saldoInicial),
      fechaSaldoInicial: aFechaMovimiento(data.fechaSaldoInicial),
      color: data.color || "teal",
      orden,
    });
  }

  async actualizarCuenta(id, data = {}) {
    if (!esObjectId(id)) throw crearError("Cuenta inválida");
    const update = {};
    if (data.nombre !== undefined) {
      const nombre = String(data.nombre).trim();
      if (!nombre) throw crearError("El nombre de la cuenta es obligatorio");
      update.nombre = nombre;
    }
    if (data.tipo !== undefined) {
      if (!["efectivo", "billetera", "banco"].includes(data.tipo)) throw crearError("Tipo de cuenta inválido");
      update.tipo = data.tipo;
    }
    if (data.esDigital !== undefined) update.esDigital = Boolean(data.esDigital);
    if (data.saldoInicial !== undefined) update.saldoInicial = redondear(data.saldoInicial);
    if (data.fechaSaldoInicial !== undefined) update.fechaSaldoInicial = aFechaMovimiento(data.fechaSaldoInicial);
    if (data.color !== undefined) update.color = String(data.color);
    if (data.orden !== undefined) update.orden = Number(data.orden) || 0;
    if (data.activa !== undefined) {
      update.activa = Boolean(data.activa);
      if (!update.activa) {
        const config = await ConfiguracionModel.findOne().lean();
        if (toId(config?.cuentaCobroDefault) === String(id)) {
          throw crearError("Es la cuenta de cobro por defecto: elegí otra antes de archivarla");
        }
      }
    }
    const cuenta = await CuentaDineroModel.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
    if (!cuenta) throw crearError("Cuenta no encontrada", 404);
    return cuenta;
  }

  async setCuentaCobroDefault(cuentaId) {
    if (!esObjectId(cuentaId)) throw crearError("Cuenta inválida");
    const cuenta = await CuentaDineroModel.findOne({ _id: cuentaId, activa: true }).lean();
    if (!cuenta) throw crearError("Cuenta no encontrada", 404);
    await ConfiguracionModel.findOneAndUpdate({}, { $set: { cuentaCobroDefault: cuenta._id } }, { upsert: true });
    return { cuentaCobroDefault: String(cuenta._id) };
  }

  // Crea un ajuste para que el saldo calculado coincida con el real.
  async ajustarSaldo(id, saldoReal, userId = null) {
    if (!esObjectId(id)) throw crearError("Cuenta inválida");
    const real = Number(saldoReal);
    if (!Number.isFinite(real)) throw crearError("El saldo real es inválido");
    const { cuentas } = await this.listarCuentas({ incluirArchivadas: true });
    const cuenta = cuentas.find((c) => String(c._id) === String(id));
    if (!cuenta) throw crearError("Cuenta no encontrada", 404);
    const diferencia = redondear(real - cuenta.saldo);
    if (Math.abs(diferencia) < 0.01) return { ajuste: null, saldo: cuenta.saldo };
    const ajuste = await MovimientoModel.create({
      tipo: "ajuste",
      direccion: diferencia > 0 ? "+" : "-",
      monto: Math.abs(diferencia),
      fecha: aFechaMovimiento(),
      cuenta: cuenta._id,
      descripcion: `Ajuste de saldo (real: ${real.toLocaleString("es-AR")})`,
      origen: { tipo: "ajuste" },
      createdBy: userId,
      updatedBy: userId,
    });
    return { ajuste, saldo: redondear(real) };
  }

  // ---------- Categorías ----------
  async listarCategorias({ incluirArchivadas = false } = {}) {
    await asegurarDatosIniciales();
    const filtro = incluirArchivadas ? {} : { activa: true };
    return CategoriaMovimientoModel.find(filtro).sort({ tipo: 1, sistema: -1, nombre: 1 }).lean();
  }

  async crearCategoria(data = {}) {
    await asegurarDatosIniciales();
    const nombre = String(data.nombre || "").trim();
    if (!nombre) throw crearError("El nombre de la categoría es obligatorio");
    if (!["ingreso", "egreso"].includes(data.tipo)) throw crearError("Tipo de categoría inválido");
    return CategoriaMovimientoModel.create({ nombre, tipo: data.tipo, color: data.color || "gray" });
  }

  async actualizarCategoria(id, data = {}) {
    if (!esObjectId(id)) throw crearError("Categoría inválida");
    const actual = await CategoriaMovimientoModel.findById(id).lean();
    if (!actual) throw crearError("Categoría no encontrada", 404);
    const update = {};
    if (data.nombre !== undefined) {
      const nombre = String(data.nombre).trim();
      if (!nombre) throw crearError("El nombre de la categoría es obligatorio");
      update.nombre = nombre;
    }
    if (data.color !== undefined) update.color = String(data.color);
    if (data.activa !== undefined) {
      if (actual.sistema && !data.activa) throw crearError("Las categorías del sistema no se pueden archivar");
      update.activa = Boolean(data.activa);
    }
    return CategoriaMovimientoModel.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
  }

  // Si la categoría tiene movimientos se archiva (para no perder el historial).
  async eliminarCategoria(id) {
    if (!esObjectId(id)) throw crearError("Categoría inválida");
    const actual = await CategoriaMovimientoModel.findById(id).lean();
    if (!actual) throw crearError("Categoría no encontrada", 404);
    if (actual.sistema) throw crearError("Las categorías del sistema no se pueden borrar");
    const enUso = await MovimientoModel.exists({ categoria: id });
    if (enUso) {
      await CategoriaMovimientoModel.updateOne({ _id: id }, { $set: { activa: false } });
      return { archivada: true };
    }
    await CategoriaMovimientoModel.deleteOne({ _id: id });
    return { eliminada: true };
  }

  // ---------- Movimientos ----------
  async validarMovimiento(data, actual = null) {
    const tipo = data.tipo ?? actual?.tipo;
    if (!["ingreso", "egreso", "transferencia"].includes(tipo)) {
      throw crearError("Tipo de movimiento inválido");
    }
    const monto = redondear(data.monto ?? actual?.monto);
    if (!(monto > 0)) throw crearError("El monto debe ser mayor a cero");

    const cuentaId = data.cuenta ?? toId(actual?.cuenta);
    if (!esObjectId(cuentaId) || !(await CuentaDineroModel.exists({ _id: cuentaId }))) {
      throw crearError("Elegí una cuenta válida");
    }

    let cuentaDestino = null;
    let categoria = null;
    if (tipo === "transferencia") {
      cuentaDestino = data.cuentaDestino ?? toId(actual?.cuentaDestino);
      if (!esObjectId(cuentaDestino) || !(await CuentaDineroModel.exists({ _id: cuentaDestino }))) {
        throw crearError("Elegí la cuenta de destino");
      }
      if (String(cuentaDestino) === String(cuentaId)) {
        throw crearError("La cuenta de origen y destino no pueden ser la misma");
      }
    } else {
      categoria = data.categoria !== undefined ? data.categoria : toId(actual?.categoria);
      if (categoria) {
        const cat = esObjectId(categoria) ? await CategoriaMovimientoModel.findById(categoria).lean() : null;
        if (!cat) throw crearError("Categoría inválida");
        if (cat.tipo !== tipo) throw crearError(`La categoría "${cat.nombre}" no es de ${tipo}s`);
      } else {
        categoria = null;
      }
    }

    return {
      tipo,
      monto,
      cuenta: cuentaId,
      cuentaDestino,
      categoria,
      fecha: data.fecha !== undefined ? aFechaMovimiento(data.fecha) : actual?.fecha ?? aFechaMovimiento(),
      descripcion: String(data.descripcion ?? actual?.descripcion ?? "").trim(),
    };
  }

  async crearMovimiento(data = {}, userId = null) {
    await asegurarDatosIniciales();
    const campos = await this.validarMovimiento(data);
    const mov = await MovimientoModel.create({
      ...campos,
      origen: { tipo: "manual" },
      createdBy: userId,
      updatedBy: userId,
    });
    return this.obtenerMovimiento(mov._id);
  }

  async actualizarMovimiento(id, data = {}, userId = null) {
    if (!esObjectId(id)) throw crearError("Movimiento inválido");
    const actual = await MovimientoModel.findById(id).lean();
    if (!actual) throw crearError("Movimiento no encontrado", 404);
    if (actual.origen?.tipo === "venta" && actual.origen?.venta) {
      throw crearError("Este movimiento viene de una venta: modificá el cobro desde la venta", 409);
    }
    if (actual.origen?.tipo === "mercadopago" || actual.origen?.mpPaymentId) {
      // Lo importado de Mercado Pago es real: solo se le cambia categoría y descripción.
      const update = { updatedBy: userId };
      if (data.descripcion !== undefined) update.descripcion = String(data.descripcion).trim();
      if (data.categoria !== undefined && actual.tipo !== "ajuste") {
        if (data.categoria) {
          const cat = esObjectId(data.categoria) ? await CategoriaMovimientoModel.findById(data.categoria).lean() : null;
          if (!cat || cat.tipo !== actual.tipo) throw crearError("Categoría inválida para este movimiento");
          update.categoria = cat._id;
        } else {
          update.categoria = null;
        }
      }
      await MovimientoModel.updateOne({ _id: id }, { $set: update });
      return this.obtenerMovimiento(id);
    }
    if (actual.tipo === "ajuste") {
      throw crearError("Los ajustes de saldo no se editan: borralo y volvé a ajustar", 409);
    }
    const campos = await this.validarMovimiento(data, actual);
    await MovimientoModel.updateOne({ _id: id }, { $set: { ...campos, updatedBy: userId } });
    return this.obtenerMovimiento(id);
  }

  async eliminarMovimiento(id) {
    if (!esObjectId(id)) throw crearError("Movimiento inválido");
    const actual = await MovimientoModel.findById(id).lean();
    if (!actual) throw crearError("Movimiento no encontrado", 404);
    if (actual.origen?.tipo === "venta" && actual.origen?.venta) {
      throw crearError("Este movimiento viene de una venta: modificá el cobro desde la venta", 409);
    }
    await MovimientoModel.deleteOne({ _id: id });
    if (actual.origen?.mpPaymentId) {
      // Si se borra algo importado de Mercado Pago, no se vuelve a importar.
      await IntegracionMercadoPagoModel.updateOne(
        { key: "mercadopago" },
        { $addToSet: { ignorados: actual.origen.mpPaymentId + ":" + actual.origen.mpTipo } },
        { upsert: true }
      );
    }
    return { eliminado: true };
  }

  poblar(query) {
    return query
      .populate("cuenta", "nombre color esDigital")
      .populate("cuentaDestino", "nombre color esDigital")
      .populate("categoria", "nombre color tipo")
      .populate("origen.venta", "cliente productoNombre valorTotal");
  }

  async obtenerMovimiento(id) {
    return this.poblar(MovimientoModel.findById(id)).lean();
  }

  construirFiltro({ desde, hasta, cuenta, categoria, tipo, q } = {}) {
    const filtro = {};
    if (esFechaISO(desde) || esFechaISO(hasta)) {
      filtro.fecha = {};
      if (esFechaISO(desde)) filtro.fecha.$gte = inicioDia(desde);
      if (esFechaISO(hasta)) filtro.fecha.$lte = finDia(hasta);
    }
    if (esObjectId(cuenta)) {
      const id = new mongoose.Types.ObjectId(String(cuenta));
      filtro.$or = [{ cuenta: id }, { cuentaDestino: id }];
    }
    if (esObjectId(categoria)) filtro.categoria = new mongoose.Types.ObjectId(String(categoria));
    if (["ingreso", "egreso", "transferencia", "ajuste"].includes(tipo)) filtro.tipo = tipo;
    if (q && String(q).trim()) {
      const rx = new RegExp(String(q).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filtro.descripcion = rx;
    }
    return filtro;
  }

  async listarMovimientos(params = {}) {
    await asegurarDatosIniciales();
    const page = Math.max(1, parseInt(params.page || "1", 10));
    const limit = Math.min(500, Math.max(1, parseInt(params.limit || "20", 10)));
    const filtro = this.construirFiltro(params);
    const [items, total] = await Promise.all([
      this.poblar(
        MovimientoModel.find(filtro)
          .sort({ fecha: -1, createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
      ).lean(),
      MovimientoModel.countDocuments(filtro),
    ]);
    return { items, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
  }

  // ---------- Resumen ----------
  async resumen({ desde, hasta } = {}) {
    await asegurarDatosIniciales();
    const rango = esFechaISO(desde) && esFechaISO(hasta) ? { desde, hasta } : rangoMesActual();
    const filtroPeriodo = { fecha: { $gte: inicioDia(rango.desde), $lte: finDia(rango.hasta) } };

    const hoy = fechaLocalAR();
    const [y, m] = hoy.split("-").map(Number);
    const inicioFlujo = new Date(Date.UTC(y, m - 6, 1));

    const [cuentas, porTipo, porCategoria, flujo] = await Promise.all([
      this.listarCuentas(),
      MovimientoModel.aggregate([
        { $match: { ...filtroPeriodo, tipo: { $in: ["ingreso", "egreso"] } } },
        { $group: { _id: "$tipo", total: { $sum: "$monto" }, cantidad: { $sum: 1 } } },
      ]),
      MovimientoModel.aggregate([
        { $match: { ...filtroPeriodo, tipo: { $in: ["ingreso", "egreso"] } } },
        { $group: { _id: { categoria: "$categoria", tipo: "$tipo" }, total: { $sum: "$monto" }, cantidad: { $sum: 1 } } },
        {
          $lookup: {
            from: CategoriaMovimientoModel.collection.name,
            localField: "_id.categoria",
            foreignField: "_id",
            as: "cat",
          },
        },
        { $sort: { total: -1 } },
      ]),
      MovimientoModel.aggregate([
        { $match: { fecha: { $gte: inicioFlujo }, tipo: { $in: ["ingreso", "egreso"] } } },
        {
          $group: {
            _id: { mes: { $dateToString: { format: "%Y-%m", date: "$fecha" } }, tipo: "$tipo" },
            total: { $sum: "$monto" },
          },
        },
      ]),
    ]);

    const totalTipo = (t) => redondear(porTipo.find((p) => p._id === t)?.total || 0);
    const ingresos = totalTipo("ingreso");
    const egresos = totalTipo("egreso");

    const categorias = porCategoria.map((fila) => ({
      categoriaId: toId(fila._id.categoria),
      nombre: fila.cat?.[0]?.nombre || "Sin categoría",
      color: fila.cat?.[0]?.color || "gray",
      tipo: fila._id.tipo,
      total: redondear(fila.total),
      cantidad: fila.cantidad,
    }));

    const meses = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(Date.UTC(y, m - 1 - i, 1));
      const clave = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      const valor = (t) => redondear(flujo.find((f) => f._id.mes === clave && f._id.tipo === t)?.total || 0);
      meses.push({ mes: clave, ingresos: valor("ingreso"), egresos: valor("egreso") });
    }

    return {
      periodo: rango,
      ...cuentas,
      ingresos,
      egresos,
      resultado: redondear(ingresos - egresos),
      ingresosPorCategoria: categorias.filter((c) => c.tipo === "ingreso"),
      egresosPorCategoria: categorias.filter((c) => c.tipo === "egreso"),
      flujoMensual: meses,
    };
  }

  // ---------- Compras (desde la lista de compras) ----------
  async registrarCompra({ cuenta, items = [], total, fecha, descripcion } = {}, userId = null) {
    const monto = redondear(total);
    if (!(monto > 0)) throw crearError("El total de la compra debe ser mayor a cero");
    if (!esObjectId(cuenta) || !(await CuentaDineroModel.exists({ _id: cuenta }))) {
      throw crearError("Elegí con qué cuenta se pagó");
    }
    if (await CuentaDineroModel.exists({ _id: cuenta, integracion: "mercadopago" })) {
      // Lo pagado con Mercado Pago entra solo (webhook/sincronización): cargarlo
      // a mano lo duplicaría.
      throw crearError("Los pagos con Mercado Pago se registran solos al sincronizar");
    }
    const categoria = await getCategoriaSistema("materiales");
    const detalle = (Array.isArray(items) ? items : []).slice(0, 200).map((it) => ({
      nombre: String(it?.nombre || "").slice(0, 200),
      seccion: String(it?.seccion || ""),
      cantidad: Number(it?.cantidad) || 0,
      precioUnitario: redondear(it?.precioUnitario),
      subtotal: redondear(it?.subtotal),
    }));
    const resumenItems = detalle
      .slice(0, 5)
      .map((it) => `${it.cantidad} × ${it.nombre}`)
      .join(", ");
    const mov = await MovimientoModel.create({
      tipo: "egreso",
      monto,
      fecha: aFechaMovimiento(fecha),
      cuenta,
      categoria: categoria?._id ?? null,
      descripcion:
        String(descripcion || "").trim() ||
        `Compra de materiales${resumenItems ? `: ${resumenItems}${detalle.length > 5 ? "…" : ""}` : ""}`,
      origen: { tipo: "compra", detalleCompra: detalle },
      createdBy: userId,
      updatedBy: userId,
    });
    return this.obtenerMovimiento(mov._id);
  }

  // ---------- Cobros de ventas ----------
  async getCuentaCobro(cuentaId) {
    await asegurarDatosIniciales();
    if (esObjectId(cuentaId)) {
      const cuenta = await CuentaDineroModel.findOne({ _id: cuentaId, activa: true }).lean();
      if (cuenta) return cuenta;
    }
    const config = await ConfiguracionModel.findOne().lean();
    if (config?.cuentaCobroDefault) {
      const cuenta = await CuentaDineroModel.findOne({ _id: config.cuentaCobroDefault, activa: true }).lean();
      if (cuenta) return cuenta;
    }
    return CuentaDineroModel.findOne({ activa: true }).sort({ orden: 1 }).lean();
  }

  // Deja los ingresos de una venta iguales a lo cobrado (valorTotal − restan):
  // si se cobró más, registra el ingreso; si se cobró menos (se desmarcó o se
  // bajó la seña), quita/achica los ingresos automáticos más recientes.
  async conciliarVenta(venta, { cuentaId = null, userId = null } = {}) {
    if (!venta?._id) return null;
    const ventaId = venta._id;
    const cobrado = redondear(Math.max(0, Number(venta.valorTotal || 0) - Number(venta.restan || 0)));

    const movs = await MovimientoModel.find({ "origen.venta": ventaId }).sort({ createdAt: -1 }).lean();
    const registrado = redondear(
      movs.reduce((acc, mv) => {
        if (mv.tipo === "ingreso") return acc + mv.monto;
        if (mv.tipo === "ajuste") return acc + (mv.direccion === "-" ? -mv.monto : mv.monto);
        return acc;
      }, 0)
    );
    const diferencia = redondear(cobrado - registrado);
    if (Math.abs(diferencia) < 0.01) return null;

    if (diferencia > 0) {
      const cuenta = await this.getCuentaCobro(cuentaId);
      if (!cuenta) {
        logger.warn("No hay cuentas de Caja activas para registrar el cobro", { ventaId: String(ventaId) });
        return null;
      }
      const categoria = await getCategoriaSistema("ventas");
      const producto = venta.productoNombre || venta.producto?.nombre || "";
      const descripcion = ["Cobro", venta.cliente, producto].filter(Boolean).join(" – ");

      // Si el cobro entra en la cuenta conectada a Mercado Pago y ya se importó
      // un cobro por el mismo monto (±10 días) sin venta, es el mismo: se vincula.
      if (cuenta.integracion === "mercadopago") {
        const importado = await buscarCobroMPSinVenta(cuenta._id, diferencia, new Date());
        if (importado) {
          await MovimientoModel.updateOne(
            { _id: importado._id },
            {
              $set: {
                "origen.venta": ventaId,
                descripcion,
                categoria: categoria?._id ?? importado.categoria,
                updatedBy: userId,
              },
            }
          );
          return MovimientoModel.findById(importado._id).lean();
        }
      }

      return MovimientoModel.create({
        tipo: "ingreso",
        monto: diferencia,
        fecha: aFechaMovimiento(),
        cuenta: cuenta._id,
        categoria: categoria?._id ?? null,
        descripcion,
        origen: { tipo: "venta", venta: ventaId },
        createdBy: userId,
        updatedBy: userId,
      });
    }

    let aDescontar = -diferencia;
    for (const mv of movs.filter((x) => x.tipo === "ingreso")) {
      if (aDescontar <= 0.009) break;
      if (mv.origen?.mpPaymentId) {
        // Es plata que entró de verdad en Mercado Pago: no se borra, solo se
        // desvincula de la venta.
        if (mv.monto <= aDescontar + 0.009) {
          await MovimientoModel.updateOne({ _id: mv._id }, { $set: { "origen.venta": null } });
          aDescontar = redondear(aDescontar - mv.monto);
        }
        continue;
      }
      if (mv.monto <= aDescontar + 0.009) {
        await MovimientoModel.deleteOne({ _id: mv._id });
        aDescontar = redondear(aDescontar - mv.monto);
      } else {
        await MovimientoModel.updateOne(
          { _id: mv._id },
          { $set: { monto: redondear(mv.monto - aDescontar), updatedBy: userId } }
        );
        aDescontar = 0;
      }
    }
    return null;
  }

  // Al borrar una venta, la plata que entró sigue en la caja: solo se corta el vínculo.
  async desvincularVenta(ventaId) {
    if (!ventaId) return;
    await MovimientoModel.updateMany(
      { "origen.venta": ventaId },
      { $set: { "origen.venta": null } }
    );
  }
}

export const cajaService = new CajaService();
export { CajaService };
