import { usuariosModelo } from "./models/index.js";

export class UserDaoMongo {
  static create(usuario) {
    try {
      let nuevoUsuario = usuariosModelo.create(usuario);
      return nuevoUsuario;
    } catch (error) {
      throw new Error(`Error al crear usuario en DB: ${error.message}`);
    }
  }

  static getBy(filtro) {
    return usuariosModelo.findOne(filtro).lean();
  }

  static getById(id) {
    return usuariosModelo.findById(id).lean();
  }

  static getAll() {
    return usuariosModelo.find().lean();
  }

  static update(id, datosActualizados) {
    return usuariosModelo
      .findByIdAndUpdate(id, { $set: datosActualizados }, { new: true })
      .lean();
  }

  static delete(id) {
    return usuariosModelo.findByIdAndDelete(id);
  }
}
