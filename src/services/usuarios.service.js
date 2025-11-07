import { UserDaoMongo as UsuariosDAO } from "../dao/UserDAOMongo.js";
import { generaHash } from "../config/config.js";
import { isValidObjectId } from "mongoose";

class UsuariosService {
  constructor(dao) {
    this.usuariosDAO = dao;
  }

  async getUsuarios() {
    return await this.usuariosDAO.getAll();
  }

  async getUsuariosById(id) {
    if (!isValidObjectId(id)) {
      res.setHeader("Content-Type", "application/json");
      return res
        .status(400)
        .json({ error: `Indique un id de tipo Id MongoDB` });
    }

    return await this.usuariosDAO.getById(id);
  }

  async updateUsuario(id, datosActualizados) {
    if (datosActualizados.password) {
      datosActualizados.password = generaHash(datosActualizados.password);
    }
    return await this.usuariosDAO.update(id, datosActualizados);
  }

  async delete(id) {
    if (!isValidObjectId(id)) {
      res.setHeader("Content-Type", "application/json");
      return res
        .status(400)
        .json({ error: `Indique un id de tipo Id MongoDB` });
    }
    return await this.usuariosDAO.delete(id);
  }
}

export const usuariosService = new UsuariosService(UsuariosDAO);
