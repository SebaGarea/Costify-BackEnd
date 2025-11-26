import { UserDaoMongo as UsuariosDAO } from "../dao/index.js";
import { generaHash } from "../config/index.js";


class UsuariosService {
  constructor(dao) {
    this.usuariosDAO = dao;
  }

  async getUsuarios() {
    return await this.usuariosDAO.getAll();
  }

  async getUsuariosById(id) {
       return await this.usuariosDAO.getById(id);
  }

  async updateUsuario(id, datosActualizados) {
    if (datosActualizados.password) {
      datosActualizados.password = generaHash(datosActualizados.password);
    }
    return await this.usuariosDAO.update(id, datosActualizados);
  }

  async delete(id) {
    return await this.usuariosDAO.delete(id);
  }
}

export const usuariosService = new UsuariosService(UsuariosDAO);
