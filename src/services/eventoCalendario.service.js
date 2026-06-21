import { EventoCalendarioDAOMongo } from "../dao/index.js";

// Normaliza la fecha de un evento a mediodía UTC.
// Un string "YYYY-MM-DD" se castea a medianoche UTC, que en husos negativos
// (Argentina UTC-3) puede leerse como el día anterior. Anclar a mediodía UTC
// (igual que las tareas con cleanDueDate) evita ese corrimiento en cualquier huso.
const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const normalizeFecha = (fecha) => {
  if (typeof fecha === "string" && DATE_ONLY_REGEX.test(fecha)) {
    return new Date(`${fecha}T12:00:00.000Z`);
  }
  return new Date(fecha);
};

class EventoCalendarioService {
  constructor(dao) {
    this.dao = dao;
  }

  buildFilter({ desde, hasta } = {}) {
    const filter = {};
    if (desde || hasta) {
      filter.fecha = {};
      if (desde) {
        const fechaDesde = new Date(desde);
        if (!Number.isNaN(fechaDesde.getTime())) {
          filter.fecha.$gte = fechaDesde;
        }
      }
      if (hasta) {
        const fechaHasta = new Date(hasta);
        if (!Number.isNaN(fechaHasta.getTime())) {
          filter.fecha.$lte = fechaHasta;
        }
      }
      if (Object.keys(filter.fecha).length === 0) delete filter.fecha;
    }
    return filter;
  }

  async createEvento({ payload, userId }) {
    const evento = {
      title: payload.title,
      description: payload.description ?? "",
      fecha: normalizeFecha(payload.fecha),
      hora: payload.hora ?? "",
      createdBy: userId,
      updatedBy: userId,
    };
    return await this.dao.create(evento);
  }

  async getEventos({ query } = {}) {
    const filter = this.buildFilter(query);
    return await this.dao.getAll({ filter });
  }

  async getEventoById(id) {
    return await this.dao.getById(id);
  }

  async updateEvento(id, { payload, userId }) {
    const patch = {
      updatedBy: userId,
    };
    if (typeof payload.title !== "undefined") patch.title = payload.title;
    if (typeof payload.description !== "undefined") patch.description = payload.description;
    if (typeof payload.fecha !== "undefined") patch.fecha = normalizeFecha(payload.fecha);
    if (typeof payload.hora !== "undefined") patch.hora = payload.hora;
    return await this.dao.update(id, patch);
  }

  async deleteEvento(id) {
    return await this.dao.delete(id);
  }
}

export const eventoCalendarioService = new EventoCalendarioService(
  EventoCalendarioDAOMongo
);
