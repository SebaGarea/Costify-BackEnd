import { TareasModel } from "./models/index.js";

export class TareasDAOMongo {
  static async create(data) {
    return await TareasModel.create(data);
  }

  static async getAll({ filter = {}, sort = { createdAt: -1, _id: -1 } } = {}) {
    return await TareasModel.find(filter).sort(sort).lean();
  }

  static async getAllPaginated(
    page = 1,
    limit = 10,
    { filter = {}, sort = { createdAt: -1, _id: -1 } } = {}
  ) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      TareasModel.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      TareasModel.countDocuments(filter),
    ]);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    return { items, total, page, limit, totalPages };
  }

  static async getById(id) {
    return await TareasModel.findById(id).lean();
  }

  static async update(id, data) {
    return await TareasModel.findByIdAndUpdate(id, data, { new: true }).lean();
  }

  static async delete(id) {
    return await TareasModel.findByIdAndDelete(id).lean();
  }
}
