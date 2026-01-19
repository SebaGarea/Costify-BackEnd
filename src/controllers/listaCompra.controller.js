import { listaCompraService } from "../services/index.js";
import logger from "../config/logger.js";

export class ListaCompraController {
  static async getListaCompra(req, res, next) {
    try {
      const listaCompra = await listaCompraService.getListaCompra();
      logger.info("Lista de compras obtenida correctamente");
      return res.json({
        status: "success",
        listaCompra,
      });
    } catch (error) {
      logger.error("Error al obtener la lista de compras", { error });
      return next(error);
    }
  }

  static async saveListaCompra(req, res, next) {
    try {
      const listaCompra = await listaCompraService.updateListaCompra(req.body || {});
      logger.info("Lista de compras actualizada correctamente");
      return res.json({
        status: "success",
        listaCompra,
      });
    } catch (error) {
      logger.error("Error al actualizar la lista de compras", { error });
      return next(error);
    }
  }
}
