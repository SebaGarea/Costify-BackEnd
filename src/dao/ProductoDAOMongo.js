import { ProductoModel } from './models/index.js';

export class ProductoDAOMongo {
  static async create(data) {
    return await ProductoModel.create(data);
  }

  static async getAll() {
    return await ProductoModel.find()
      .populate('planillaCosto') 
      .lean();
  }

  static async getById(id) {
    return await ProductoModel.findById(id)
      .populate('planillaCosto')
      .lean();
  }

  static async getByCatalogo(catalogo) {
    return await ProductoModel.find({ catalogo: catalogo })
      .populate('planillaCosto') 
      .lean();
  }
  static async getByModelo(modelo) {
    return await ProductoModel.find({ modelo: modelo })
      .populate('planillaCosto') 
      .lean();
  }

  static async update(id, data) {
    return await ProductoModel.findByIdAndUpdate(id, data, { new: true })
      .populate('planillaCosto')
      .lean();
  }

  static async delete(id) {
    return await ProductoModel.findByIdAndDelete(id).lean();
  }
}