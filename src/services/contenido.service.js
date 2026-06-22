import { ContenidoDAOMongo } from "../dao/index.js";

class ContenidoService {
  constructor(dao) {
    this.dao = dao;
  }

  buildFilter({ q, estado, canal, responsable, producto } = {}) {
    const filter = {};

    if (estado) filter.estado = estado;
    if (canal) filter.canales = canal;
    if (responsable) filter.responsable = responsable;
    if (producto) filter.producto = producto;

    if (q) {
      const regex = new RegExp(q, "i");
      filter.$or = [{ titulo: regex }, { copy: regex }, { notas: regex }];
    }

    return filter;
  }

  buildSort(sortKey) {
    if (sortKey === "fechaPublicacion") return { fechaPublicacion: 1, createdAt: -1, _id: -1 };
    if (sortKey === "updatedAt") return { updatedAt: -1, _id: -1 };
    if (sortKey === "kanban") return { estado: 1, orden: 1, createdAt: -1 };
    return { createdAt: -1, _id: -1 };
  }

  async createContenido({ payload, userId }) {
    const contenido = {
      titulo: payload.titulo,
      estado: payload.estado ?? "idea",
      canales: Array.isArray(payload.canales) ? payload.canales : ["instagram", "facebook"],
      tipo: payload.tipo ?? "foto",
      fechaPublicacion: payload.fechaPublicacion || null,
      producto: payload.producto || null,
      // Por defecto, el responsable es quien la crea (req.user).
      responsable: payload.responsable || userId || null,
      copy: payload.copy ?? "",
      notas: payload.notas ?? "",
      checklist: Array.isArray(payload.checklist) ? payload.checklist : [],
      enlaces: Array.isArray(payload.enlaces) ? payload.enlaces : [],
      orden: Number.isFinite(Number(payload.orden)) ? Number(payload.orden) : 0,
      createdBy: userId,
      updatedBy: userId,
    };
    return await this.dao.create(contenido);
  }

  async getContenidos({ query } = {}) {
    const filter = this.buildFilter(query);
    const sort = this.buildSort(query?.sort);
    return await this.dao.getAll({ filter, sort });
  }

  async getContenidosPaginated(page = 1, limit = 50, { query } = {}) {
    const filter = this.buildFilter(query);
    const sort = this.buildSort(query?.sort);
    return await this.dao.getAllPaginated(page, limit, { filter, sort });
  }

  async getContenidoById(id) {
    return await this.dao.getById(id);
  }

  async updateContenido(id, { payload, userId }) {
    const patch = { updatedBy: userId };

    if (typeof payload.titulo !== "undefined") patch.titulo = payload.titulo;
    if (typeof payload.estado !== "undefined") patch.estado = payload.estado;
    if (typeof payload.canales !== "undefined") patch.canales = payload.canales;
    if (typeof payload.tipo !== "undefined") patch.tipo = payload.tipo;
    if (typeof payload.fechaPublicacion !== "undefined")
      patch.fechaPublicacion = payload.fechaPublicacion || null;
    if (typeof payload.producto !== "undefined") patch.producto = payload.producto || null;
    if (typeof payload.responsable !== "undefined") patch.responsable = payload.responsable || null;
    if (typeof payload.copy !== "undefined") patch.copy = payload.copy;
    if (typeof payload.notas !== "undefined") patch.notas = payload.notas;
    if (typeof payload.checklist !== "undefined") patch.checklist = payload.checklist;
    if (typeof payload.enlaces !== "undefined") patch.enlaces = payload.enlaces;
    if (typeof payload.orden !== "undefined") patch.orden = payload.orden;

    return await this.dao.update(id, patch);
  }

  async deleteContenido(id) {
    return await this.dao.delete(id);
  }
}

export const contenidoService = new ContenidoService(ContenidoDAOMongo);
