import { VentasModel } from "./models/VentasSchema.js";

export class VentasDAOMongo {
  static async create(data) {
    return await VentasModel.create(data);
  }

  static async getAll() {
    return await VentasModel.find().sort({ createdAt: -1, fecha: -1, _id: -1 }).populate({
      path: 'producto',
      populate: { path: 'planillaCosto' }
    }).lean();
  }
  static async getAllPaginated(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      VentasModel.find()
        .sort({ createdAt: -1, fecha: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .populate({ path: 'producto', populate: { path: 'planillaCosto' } })
        .lean(),
      VentasModel.countDocuments({})
    ]);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    return { items, total, page, limit, totalPages };
  }

  static async getById(id) {
    return await VentasModel.findById(id).populate({
      path: 'producto',
      populate: { path: 'planillaCosto' }
    }).lean();
  }

  static async update(id, ventasData) {
    return await VentasModel.findByIdAndUpdate(id, ventasData, {
      new: true,
    }).lean();
  }

  static async delete(id) {
    return await VentasModel.findByIdAndDelete(id).lean();
  }

  static async getByCliente(cliente) {
    return await VentasModel.find({ cliente: cliente }).sort({ createdAt: -1, fecha: -1, _id: -1 }).lean();
  }

  static async getByEstado(estado) {
    return await VentasModel.find({ estado: estado }).sort({ createdAt: -1, fecha: -1, _id: -1 }).lean();
  }
}
