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

  static async vincularItemPlantilla(req, res, next) {
    try {
      const listaCompra = await listaCompraService.vincularItemPlantilla(req.body || {});
      logger.info("Ítem de planilla agregado a la lista de compras", {
        plantillaId: req.body?.plantillaId,
        uid: req.body?.uid,
      });
      return res.json({
        status: "success",
        listaCompra,
      });
    } catch (error) {
      logger.error("Error al agregar el ítem de planilla a la lista de compras", { error });
      return next(error);
    }
  }

  static async desvincularItemPlantilla(req, res, next) {
    try {
      const { plantillaId, uid } = req.params;
      const listaCompra = await listaCompraService.desvincularItemPlantilla(plantillaId, uid);
      logger.info("Ítem de planilla quitado de la lista de compras", { plantillaId, uid });
      return res.json({
        status: "success",
        listaCompra,
      });
    } catch (error) {
      logger.error("Error al quitar el ítem de planilla de la lista de compras", { error });
      return next(error);
    }
  }
}
