import { VentasModel } from "./models/VentasSchema.js";

export class VentasDAOMongo {
  static async create(data) {
    return await VentasModel.create(data);
  }

  static async getAll() {
    return await VentasModel.find().lean();
  }

  static async getById(id) {
    return await VentasModel.findById(id).lean();
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
    return await VentasModel.find({ cliente: cliente }).lean();
  }

  static async getByEstado(estado) {
    return await VentasModel.find({ estado: estado }).lean();
  }
}
