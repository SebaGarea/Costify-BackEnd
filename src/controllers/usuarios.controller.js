import { isValidObjectId } from "mongoose";
import { usuariosService } from "../services/usuarios.service.js";
import { UsuarioDTO } from "../dtos/usuarios.dto.js";

export default class UsuariosController {
  static async getUsuarios(req, res) {
    try {
      let usuarios = await usuariosService.getUsuarios();
      let usuariosDTO = UsuarioDTO.fromArray(usuarios);

      res.setHeader("Content-Type", "application/json");
      return res.status(200).json({
        status: "succes",
        usuarios: usuariosDTO,
      });

    } catch (error) {
      res.setHeader("Content-Type", "application/json");
      return res
        .status(500)
        .json({ error: `Error al obtener usuarios: ${error}` });
    }
  }

  static async getUsuariosById(req, res) {
    let { id } = req.params;

    try {
      let usuario = await usuariosService.getUsuariosById(id);
      let usuarioDTO = UsuarioDTO.fromObject(usuario);

      res.setHeader("Content-Type", "application/json");
      return res.status(200).json({ succes: "succes", usuario: usuarioDTO });
      
    } catch (error) {
      res.setHeader("Content-Type", "application/json");
      return res.status(500).json({ error: `${error.message}` });
    }
  }

  static async updateUsuario(req, res) {
    let { id } = req.params;
    let { first_name, last_name, email, age, password } = req.body;

    if (!isValidObjectId(id)) {
      res.setHeader("Content-Type", "application/json");
      return res.status(400).json({ error: `Indique un id de usuario valido` });
    }
    try {
      let usuarioActualizado = await usuariosService.updateUsuario(id, {
        first_name,
        last_name,
        email,
        age,
        password,
      });
      if (!usuarioActualizado) {
        res.setHeader("Content-Type", "application/json");
        return res
          .status(404)
          .json({ error: `No se encontró ningún usuario con el ID: ${id}` });
      }

      let usuarioDTO = UsuarioDTO.fromObject(usuarioActualizado);


      res.setHeader("Content-Type", "application/json");
      return res.status(200).json({
        status: "succes",
        usuario: usuarioDTO,
      });
    } catch (error) {
      res.setHeader("Content-Type", "application/json");
      return res
        .status(400)
        .json({ error: `Error al actualizar el usuario: ${error.message}` });
    }
  }

  static async deleteUsuario(req, res){
    let {id} = req.params;
    try {
      let usuario = await usuariosService.delete(id);
      let usuarioDTO = UsuarioDTO.fromObject(usuario)

      res.setHeader('Content-Type','application/json');
      return res.status(200).json({payload:"succes", usuario:usuarioDTO});
    } catch (error) {
      console.log(error);
      res.setHeader('Content-Type','application/json');
      return res.status(500).json(
        {
          error:`Error al eliminar al Usuario en el Controller`,
          detalle:`${error.message}`
        }
      )
      
    }
  }
}
