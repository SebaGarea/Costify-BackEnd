import { TareasDAOMongo } from "../dao/index.js";

class TareasService {
  constructor(dao) {
    this.dao = dao;
  }

  buildFilter({ q, status, priority, tag } = {}) {
    const filter = {};

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (tag) filter.tags = tag;

    if (q) {
      const regex = new RegExp(q, "i");
      filter.$or = [{ title: regex }, { notes: regex }];
    }

    return filter;
  }

  buildSort(sortKey) {
    if (sortKey === "dueDate") return { dueDate: 1, createdAt: -1, _id: -1 };
    if (sortKey === "updatedAt") return { updatedAt: -1, _id: -1 };
    return { createdAt: -1, _id: -1 };
  }

  async createTarea({ payload, userId }) {
    const tarea = {
      title: payload.title,
      notes: payload.notes ?? "",
      status: payload.status ?? "pendiente",
      priority: payload.priority ?? "media",
      dueDate: payload.dueDate || null,
      tags: Array.isArray(payload.tags) ? payload.tags : [],
      createdBy: userId,
      updatedBy: userId,
    };
    return await this.dao.create(tarea);
  }

  async getTareas({ query } = {}) {
    const filter = this.buildFilter(query);
    const sort = this.buildSort(query?.sort);
    return await this.dao.getAll({ filter, sort });
  }

  async getTareasPaginated(page = 1, limit = 10, { query } = {}) {
    const filter = this.buildFilter(query);
    const sort = this.buildSort(query?.sort);
    return await this.dao.getAllPaginated(page, limit, { filter, sort });
  }

  async getTareaById(id) {
    return await this.dao.getById(id);
  }

  async updateTarea(id, { payload, userId }) {
    const patch = {
      updatedBy: userId,
    };

    if (typeof payload.title !== "undefined") patch.title = payload.title;
    if (typeof payload.notes !== "undefined") patch.notes = payload.notes;
    if (typeof payload.status !== "undefined") patch.status = payload.status;
    if (typeof payload.priority !== "undefined") patch.priority = payload.priority;
    if (typeof payload.tags !== "undefined") patch.tags = payload.tags;
    if (typeof payload.dueDate !== "undefined") patch.dueDate = payload.dueDate || null;

    return await this.dao.update(id, patch);
  }

  async deleteTarea(id) {
    return await this.dao.delete(id);
  }
}

export const tareasService = new TareasService(TareasDAOMongo);
