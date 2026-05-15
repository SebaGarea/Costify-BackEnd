import { EventoCalendarioDAOMongo } from "../dao/index.js";

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
      fecha: payload.fecha,
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
    if (typeof payload.fecha !== "undefined") patch.fecha = payload.fecha;
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
