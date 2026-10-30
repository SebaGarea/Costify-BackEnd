import { cajaService } from "../services/caja.service.js";
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
  setCuentaCobroDefault: accion("cuenta de cobro por defecto", (req) =>
    cajaService.setCuentaCobroDefault(req.body?.cuentaId)
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

  resumen: accion("resumen", (req) => cajaService.resumen(req.query)),
  registrarCompra: accion(
    "registrar compra",
    (req) => cajaService.registrarCompra(req.body, userId(req)),
    201
  ),
};
