import { cajaService } from "../services/caja.service.js";
import { mercadoPagoService, verificarFirmaWebhook } from "../services/mercadopago.service.js";
import logger from "../config/logger.js";

// Envuelve cada acción: responde el resultado y delega los errores al errorHandler.
const accion = (nombre, fn, status = 200) => async (req, res, next) => {
  try {
    const resultado = await fn(req);
    res.status(status).json(resultado);
  } catch (error) {
    if (!error.status || error.status >= 500) {
      logger.error(`Error en caja: ${nombre}`, { error });
    }
    next(error);
  }
};

const userId = (req) => req.user?._id ?? null;
const incluirArchivadas = (req) => req.query.archivadas === "true";

// Webhook de Mercado Pago: es solo un aviso. Se verifica la firma y se dispara
// la sincronización (que es la que importa y concilia). Se responde enseguida.
export const mercadoPagoWebhook = (req, res) => {
  const dataId = req.query["data.id"] ?? req.query?.data?.id ?? req.body?.data?.id ?? req.query.id;
  const valida = verificarFirmaWebhook({
    xSignature: req.get("x-signature"),
    xRequestId: req.get("x-request-id"),
    dataId,
  });
  if (!valida) {
    logger.warn("Webhook de Mercado Pago con firma inválida", { ip: req.ip, dataId });
    return res.sendStatus(401);
  }
  mercadoPagoService.solicitarSincronizacion();
  return res.sendStatus(200);
};

export const cajaController = {
  listarCuentas: accion("listar cuentas", (req) =>
    cajaService.listarCuentas({ incluirArchivadas: incluirArchivadas(req) })
  ),
  crearCuenta: accion("crear cuenta", (req) => cajaService.crearCuenta(req.body), 201),
  actualizarCuenta: accion("actualizar cuenta", (req) =>
    cajaService.actualizarCuenta(req.params.id, req.body)
  ),
  ajustarSaldo: accion("ajustar saldo", (req) =>
    cajaService.ajustarSaldo(req.params.id, req.body?.saldoReal, userId(req))
  ),

  listarCategorias: accion("listar categorías", (req) =>
    cajaService.listarCategorias({ incluirArchivadas: incluirArchivadas(req) })
  ),
  crearCategoria: accion("crear categoría", (req) => cajaService.crearCategoria(req.body), 201),
  actualizarCategoria: accion("actualizar categoría", (req) =>
    cajaService.actualizarCategoria(req.params.id, req.body)
  ),
  eliminarCategoria: accion("eliminar categoría", (req) =>
    cajaService.eliminarCategoria(req.params.id)
  ),

  listarMovimientos: accion("listar movimientos", (req) => cajaService.listarMovimientos(req.query)),
  crearMovimiento: accion(
    "crear movimiento",
    (req) => cajaService.crearMovimiento(req.body, userId(req)),
    201
  ),
  actualizarMovimiento: accion("actualizar movimiento", (req) =>
    cajaService.actualizarMovimiento(req.params.id, req.body, userId(req))
  ),
  eliminarMovimiento: accion("eliminar movimiento", (req) =>
    cajaService.eliminarMovimiento(req.params.id)
  ),

  mercadoPagoEstado: accion("estado de Mercado Pago", () => mercadoPagoService.estado()),
  mercadoPagoSync: accion("sincronizar Mercado Pago", () => mercadoPagoService.sincronizar()),

  resumen: accion("resumen", (req) => cajaService.resumen(req.query)),
  registrarCompra: accion(
    "registrar compra",
    (req) => cajaService.registrarCompra(req.body, userId(req)),
    201
  ),
};
