import { contenidoService } from "../services/index.js";
import logger from "../config/logger.js";

export const contenidoController = {
  async createContenido(req, res, next) {
    try {
      const userId = req.user?._id;
      const contenido = await contenidoService.createContenido({ payload: req.body, userId });
      if (!contenido) {
        logger.warn("No se pudo crear la publicación", { body: req.body });
        const error = new Error("No se pudo crear la publicación");
        error.status = 400;
        return next(error);
      }
      logger.info("Publicación creada exitosamente", { id: contenido._id });
      res.status(201).json(contenido);
    } catch (error) {
      logger.error("Error al crear la publicación", { error });
      next(error);
    }
  },

  async getAllContenidos(req, res, next) {
    try {
      const page = Math.max(1, parseInt(req.query.page || "1", 10));
      const limit = Math.max(1, parseInt(req.query.limit || "50", 10));
      const query = {
        q: req.query.q,
        estado: req.query.estado,
        canal: req.query.canal,
        responsable: req.query.responsable,
        producto: req.query.producto,
        sort: req.query.sort,
      };

      if (req.query.page || req.query.limit) {
        const result = await contenidoService.getContenidosPaginated(page, limit, { query });
        return res.json(result);
      }

      const contenidos = await contenidoService.getContenidos({ query });
      res.json(contenidos);
    } catch (error) {
      logger.error("Error al obtener las publicaciones", { error });
      next(error);
    }
  },

  async getContenidoById(req, res, next) {
    try {
      const contenido = await contenidoService.getContenidoById(req.params.id);
      if (!contenido) {
        logger.warn("Publicación no encontrada", { id: req.params.id });
        const error = new Error("Publicación no encontrada");
        error.status = 404;
        return next(error);
      }
      res.json(contenido);
    } catch (error) {
      logger.error("Error al obtener la publicación", { error });
      next(error);
    }
  },

  async updateContenido(req, res, next) {
    try {
      const userId = req.user?._id;
      const contenido = await contenidoService.updateContenido(req.params.id, {
        payload: req.body,
        userId,
      });
      if (!contenido) {
        logger.warn("Publicación no encontrada para actualizar", { id: req.params.id });
        const error = new Error("Publicación no encontrada");
        error.status = 404;
        return next(error);
      }
      res.json(contenido);
    } catch (error) {
      logger.error("Error al actualizar la publicación", { error });
      next(error);
    }
  },

  async deleteContenido(req, res, next) {
    try {
      const contenido = await contenidoService.deleteContenido(req.params.id);
      if (!contenido) {
        logger.warn("Publicación no encontrada para eliminar", { id: req.params.id });
        const error = new Error("Publicación no encontrada");
        error.status = 404;
        return next(error);
      }
      res.json({ message: `Publicación eliminada, ID: ${req.params.id}` });
    } catch (error) {
      logger.error("Error al eliminar la publicación", { error });
      next(error);
    }
  },
};
