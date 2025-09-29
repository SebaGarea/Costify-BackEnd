import { PlantillaCostoModel } from './models/PlantillaCostoSchema.js';

export class PlantillaCostoDAOMongo {
  static async create(data) {
    return await PlantillaCostoModel.create(data);
  }

  static async getAll(filtros = {}) {
    return await PlantillaCostoModel.find(filtros).populate('items.materiaPrima').lean();
  }

  static async getById(id) {
    return await PlantillaCostoModel.findById(id).populate('items.materiaPrima').lean();
  }

  static async update(id, data) {
    return await PlantillaCostoModel.findByIdAndUpdate(id, data, { new: true }).populate('items.materiaPrima').lean();
  }

  static async delete(id) {
    return await PlantillaCostoModel.findByIdAndDelete(id).lean();
  }
}