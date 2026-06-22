import { ContenidoModel } from "./models/index.js";

const POPULATE = [
  { path: "createdBy", select: "first_name last_name email" },
  { path: "updatedBy", select: "first_name last_name email" },
  { path: "responsable", select: "first_name last_name email" },
  { path: "producto", select: "nombre modelo catalogo" },
];

export class ContenidoDAOMongo {
  static async create(data) {
    const created = await ContenidoModel.create(data);
    return await ContenidoModel.findById(created._id).populate(POPULATE).lean();
  }

  static async getAll({ filter = {}, sort = { estado: 1, orden: 1, createdAt: -1 } } = {}) {
    return await ContenidoModel.find(filter).sort(sort).populate(POPULATE).lean();
  }

  static async getAllPaginated(
    page = 1,
    limit = 50,
    { filter = {}, sort = { estado: 1, orden: 1, createdAt: -1 } } = {}
  ) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      ContenidoModel.find(filter).sort(sort).skip(skip).limit(limit).populate(POPULATE).lean(),
      ContenidoModel.countDocuments(filter),
    ]);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    return { items, total, page, limit, totalPages };
  }

  static async getById(id) {
    return await ContenidoModel.findById(id).populate(POPULATE).lean();
  }

  static async update(id, data) {
    return await ContenidoModel.findByIdAndUpdate(id, data, { new: true })
      .populate(POPULATE)
      .lean();
  }

  static async delete(id) {
    return await ContenidoModel.findByIdAndDelete(id).lean();
  }
}
