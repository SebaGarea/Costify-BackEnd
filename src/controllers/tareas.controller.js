import { tareasService } from "../services/index.js";
import logger from "../config/logger.js";

export const tareasController = {
  async createTarea(req, res, next) {
    try {
      const userId = req.user?._id;
      const tarea = await tareasService.createTarea({ payload: req.body, userId });
      if (!tarea) {
        logger.warn("No se pudo crear la tarea", { body: req.body });
        const error = new Error("No se pudo crear la tarea");
        error.status = 400;
        return next(error);
      }
      logger.info("Tarea creada exitosamente", { id: tarea._id });
      res.status(201).json(tarea);
    } catch (error) {
      logger.error("Error al crear la tarea", { error });
      next(error);
    }
  },

  async getAllTareas(req, res, next) {
    try {
      const page = Math.max(1, parseInt(req.query.page || "1", 10));
      const limit = Math.max(1, parseInt(req.query.limit || "10", 10));
      const query = {
        q: req.query.q,
        status: req.query.status,
        priority: req.query.priority,
        tag: req.query.tag,
        sort: req.query.sort,
      };

      if (req.query.page || req.query.limit) {
        const result = await tareasService.getTareasPaginated(page, limit, { query });
        return res.json(result);
      }

      const tareas = await tareasService.getTareas({ query });
      res.json(tareas);
    } catch (error) {
      logger.error("Error al obtener las tareas", { error });
      next(error);
    }
  },

  async getTareaById(req, res, next) {
    try {
      const tarea = await tareasService.getTareaById(req.params.id);
      if (!tarea) {
        logger.warn("Tarea no encontrada", { id: req.params.id });
        const error = new Error("Tarea no encontrada");
        error.status = 404;
        return next(error);
      }
      res.json(tarea);
    } catch (error) {
      logger.error("Error al obtener la tarea", { error });
      next(error);
    }
  },

  async updateTarea(req, res, next) {
    try {
      const userId = req.user?._id;
      const tarea = await tareasService.updateTarea(req.params.id, { payload: req.body, userId });
      if (!tarea) {
        logger.warn("Tarea no encontrada para actualizar", { id: req.params.id });
        const error = new Error("Tarea no encontrada");
        error.status = 404;
        return next(error);
      }
      res.json(tarea);
    } catch (error) {
      logger.error("Error al actualizar la tarea", { error });
      next(error);
    }
  },

  async deleteTarea(req, res, next) {
    try {
      const tarea = await tareasService.deleteTarea(req.params.id);
      if (!tarea) {
        logger.warn("Tarea no encontrada para eliminar", { id: req.params.id });
        const error = new Error("Tarea no encontrada");
        error.status = 404;
        return next(error);
      }
      res.json({ message: `Tarea eliminada, ID: ${req.params.id}` });
    } catch (error) {
      logger.error("Error al eliminar la tarea", { error });
      next(error);
    }
  },
};
