import { PlantillaCostoModel } from './models/index.js';

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

  static async updateManyTipoProyecto(tipoActual, tipoNuevo) {
    return await PlantillaCostoModel.updateMany(
      { tipoProyecto: tipoActual },
      { $set: { tipoProyecto: tipoNuevo } }
    );
  }

  static async pushArchivos(id, archivos = []) {
    return await PlantillaCostoModel.findByIdAndUpdate(
      id,
      { $push: { archivos: { $each: archivos } } },
      { new: true }
    ).lean();
  }

  static async pullArchivo(id, publicId) {
    return await PlantillaCostoModel.findByIdAndUpdate(
      id,
      { $pull: { archivos: { publicId } } },
      { new: true }
    ).lean();
  }

  static async getArchivo(id, publicId) {
    const plantilla = await PlantillaCostoModel.findById(id).select('archivos').lean();
    if (!plantilla) return null;
    return (plantilla.archivos || []).find((a) => a.publicId === publicId) || null;
  }

  static async getTiposProyecto() {
    return await PlantillaCostoModel.distinct('tipoProyecto', {
      tipoProyecto: { $nin: ['', null, 'Otro'] },
    });
  }
}