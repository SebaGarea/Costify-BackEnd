import { PerfilPinturaModel } from "./models/PerfilPinturaSchema.js";

export class PerfilPinturaDAOMongo {
  static getAll() {
    return PerfilPinturaModel.find({ activo: true }).sort({ tipo: 1, nombre: 1 }).lean();
  }

  static getById(id) {
    return PerfilPinturaModel.findById(id).lean();
  }

  static create(data) {
    return PerfilPinturaModel.create(data);
  }

  static update(id, data) {
    return PerfilPinturaModel.findByIdAndUpdate(id, data, { new: true }).lean();
  }

  static delete(id) {
    return PerfilPinturaModel.findByIdAndUpdate(id, { activo: false }, { new: true }).lean();
  }

  static count() {
    return PerfilPinturaModel.countDocuments({ activo: true });
  }

  static hardDeleteAll() {
    return PerfilPinturaModel.deleteMany({});
  }
}
