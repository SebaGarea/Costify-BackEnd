import { eventoCalendarioService } from "../services/index.js";
import logger from "../config/logger.js";

const puedeModificar = (evento, user) => {
  if (!evento || !user) return false;
  if (user.role === "admin") return true;
  const creadorId = evento.createdBy?._id ?? evento.createdBy;
  if (!creadorId) return false;
  return creadorId.toString() === user._id?.toString();
};

export const eventoCalendarioController = {
  async createEvento(req, res, next) {
    try {
      const userId = req.user?._id;
      const evento = await eventoCalendarioService.createEvento({
        payload: req.body,
        userId,
      });
      if (!evento) {
        logger.warn("No se pudo crear el evento", { body: req.body });
        const error = new Error("No se pudo crear el evento");
        error.status = 400;
        return next(error);
      }
      logger.info("Evento creado exitosamente", { id: evento._id });
      res.status(201).json(evento);
    } catch (error) {
      logger.error("Error al crear el evento", { error });
      next(error);
    }
  },

  async getAllEventos(req, res, next) {
    try {
      const query = {
        desde: req.query.desde,
        hasta: req.query.hasta,
      };
      const eventos = await eventoCalendarioService.getEventos({ query });
      res.json(eventos);
    } catch (error) {
      logger.error("Error al obtener los eventos", { error });
      next(error);
    }
  },

  async getEventoById(req, res, next) {
    try {
      const evento = await eventoCalendarioService.getEventoById(req.params.id);
      if (!evento) {
        logger.warn("Evento no encontrado", { id: req.params.id });
        const error = new Error("Evento no encontrado");
        error.status = 404;
        return next(error);
      }
      res.json(evento);
    } catch (error) {
      logger.error("Error al obtener el evento", { error });
      next(error);
    }
  },

  async updateEvento(req, res, next) {
    try {
      const eventoExistente = await eventoCalendarioService.getEventoById(req.params.id);
      if (!eventoExistente) {
        const error = new Error("Evento no encontrado");
        error.status = 404;
        return next(error);
      }
      if (!puedeModificar(eventoExistente, req.user)) {
        const error = new Error("No tenés permiso para modificar este evento");
        error.status = 403;
        return next(error);
      }
      const userId = req.user?._id;
      const evento = await eventoCalendarioService.updateEvento(req.params.id, {
        payload: req.body,
        userId,
      });
      res.json(evento);
    } catch (error) {
      logger.error("Error al actualizar el evento", { error });
      next(error);
    }
  },

  async deleteEvento(req, res, next) {
    try {
      const eventoExistente = await eventoCalendarioService.getEventoById(req.params.id);
      if (!eventoExistente) {
        const error = new Error("Evento no encontrado");
        error.status = 404;
        return next(error);
      }
      if (!puedeModificar(eventoExistente, req.user)) {
        const error = new Error("No tenés permiso para eliminar este evento");
        error.status = 403;
        return next(error);
      }
      await eventoCalendarioService.deleteEvento(req.params.id);
      res.json({ message: `Evento eliminado, ID: ${req.params.id}` });
    } catch (error) {
      logger.error("Error al eliminar el evento", { error });
      next(error);
    }
  },
};
