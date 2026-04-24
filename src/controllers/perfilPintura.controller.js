import { perfilPinturaService } from "../services/perfilPintura.service.js";
import logger from "../config/logger.js";

export class PerfilPinturaController {
  static async getAll(req, res, next) {
    try {
      const perfiles = await perfilPinturaService.getAll();
      return res.status(200).json({ status: "success", perfiles });
    } catch (error) {
      logger.error("Error al obtener perfiles de pintura", { error: error.message });
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const { nombre, tipo, perimetro } = req.body;
      const perfil = await perfilPinturaService.create({ nombre, tipo, perimetro });
      logger.info("Perfil de pintura creado", { id: perfil._id });
      return res.status(201).json({ status: "success", perfil });
    } catch (error) {
      logger.error("Error al crear perfil de pintura", { error: error.message });
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const { nombre, tipo, perimetro } = req.body;
      const perfil = await perfilPinturaService.update(id, { nombre, tipo, perimetro });
      if (!perfil) {
        const err = new Error("Perfil no encontrado");
        err.status = 404;
        return next(err);
      }
      logger.info("Perfil de pintura actualizado", { id });
      return res.status(200).json({ status: "success", perfil });
    } catch (error) {
      logger.error("Error al actualizar perfil de pintura", { error: error.message });
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const { id } = req.params;
      const perfil = await perfilPinturaService.delete(id);
      if (!perfil) {
        const err = new Error("Perfil no encontrado");
        err.status = 404;
        return next(err);
      }
      logger.info("Perfil de pintura eliminado", { id });
      return res.status(200).json({ status: "success", perfil });
    } catch (error) {
      logger.error("Error al eliminar perfil de pintura", { error: error.message });
      next(error);
    }
  }
}
