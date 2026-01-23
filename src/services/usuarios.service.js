import { UserDaoMongo as UsuariosDAO } from "../dao/index.js";
import { generaHash } from "../config/index.js";


export class UsuariosService {
  constructor(dao, hashFn = generaHash) {
    this.usuariosDAO = dao;
    this.hashFn = hashFn;
  }

  async getUsuarios() {
    return await this.usuariosDAO.getAll();
  }

  async getUsuariosById(id) {
       return await this.usuariosDAO.getById(id);
  }

  async getUsuarioByEmail(email) {
    return await this.usuariosDAO.getBy({ email });
  }

  async createUsuario(datos) {
    if (datos.password) {
      datos.password = this.hashFn(datos.password);
    }
    if (datos.email) {
      datos.email = datos.email.trim().toLowerCase();
    }
    return await this.usuariosDAO.create(datos);
  }

  async updateUsuario(id, datosActualizados) {
    if (datosActualizados.password) {
      datosActualizados.password = this.hashFn(datosActualizados.password);
    }
    return await this.usuariosDAO.update(id, datosActualizados);
  }

  async delete(id) {
    return await this.usuariosDAO.delete(id);
  }
}

export const usuariosService = new UsuariosService(UsuariosDAO);
