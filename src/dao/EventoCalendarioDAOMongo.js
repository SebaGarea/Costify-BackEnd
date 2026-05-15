import { EventoCalendarioModel } from "./models/index.js";

const POPULATE_CREATED_BY = {
  path: "createdBy",
  select: "first_name last_name email",
};

const POPULATE_UPDATED_BY = {
  path: "updatedBy",
  select: "first_name last_name email",
};

export class EventoCalendarioDAOMongo {
  static async create(data) {
    const created = await EventoCalendarioModel.create(data);
    return await EventoCalendarioModel.findById(created._id)
      .populate(POPULATE_CREATED_BY)
      .populate(POPULATE_UPDATED_BY)
      .lean();
  }

  static async getAll({ filter = {}, sort = { fecha: 1, createdAt: -1 } } = {}) {
    return await EventoCalendarioModel.find(filter)
      .sort(sort)
      .populate(POPULATE_CREATED_BY)
      .populate(POPULATE_UPDATED_BY)
      .lean();
  }

  static async getById(id) {
    return await EventoCalendarioModel.findById(id)
      .populate(POPULATE_CREATED_BY)
      .populate(POPULATE_UPDATED_BY)
      .lean();
  }

  static async update(id, data) {
    return await EventoCalendarioModel.findByIdAndUpdate(id, data, { new: true })
      .populate(POPULATE_CREATED_BY)
      .populate(POPULATE_UPDATED_BY)
      .lean();
  }

  static async delete(id) {
    return await EventoCalendarioModel.findByIdAndDelete(id).lean();
  }
}
