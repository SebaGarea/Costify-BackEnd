import { isValidObjectId } from "mongoose";
import { usuariosService } from "../services/usuarios.service.js";
import { UsuarioDTO } from "../dtos/usuarios.dto.js";
import jwt from "jsonwebtoken";
import { generaHash } from "../config/config.js";
import dotenv from "dotenv";
dotenv.config();

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
    let { first_name, last_name, email, role, password } = req.body;

    try {
      let usuarioActualizado = await usuariosService.updateUsuario(id, {
        first_name,
        last_name,
        email,       
        password,
        role,
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

  static async deleteUsuario(req, res) {
    let { id } = req.params;
    try {
      let usuario = await usuariosService.delete(id);
      let usuarioDTO = UsuarioDTO.fromObject(usuario);

      res.setHeader("Content-Type", "application/json");
      return res.status(200).json({ payload: "succes", usuario: usuarioDTO });
    } catch (error) {
      console.log(error);
      res.setHeader("Content-Type", "application/json");
      return res.status(500).json({
        error: `Error al eliminar al Usuario en el Controller`,
        detalle: `${error.message}`,
      });
    }
  }

  static async loginUsuario(req, res) {
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, {
      expiresIn: "8h",
    });
    res.json({ mensaje: "Login local exitoso", token, usuario: req.user });
  }

  static async loginGoogleCallback(req, res) {
    try {
      const token = jwt.sign(
        { id: req.user._id, role: req.user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );
      return res.redirect(`http://localhost:8080/?token=${token}`);    
    } catch (error) {
      console.error("Error en loginGoogleCallback:", error);
      res.status(500).json({ error: "Error en login con Google" });
    }
  }

  static async registroUsuario(req, res) {
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({ mensaje: "Registro exitoso", token, usuario: req.user });
  }

  static async setPassword(req, res) {
    const { email, password } = req.body;
  
    try {
      let usuario = await usuariosService.usuariosDAO.getBy({ email });
      if (!usuario) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      const { generaHash } = await import("../config/config.js");
      const passwordHash = generaHash(password);
      await usuariosService.usuariosDAO.update(usuario._id, {
        password: passwordHash,
      });
      return res
        .status(200)
        .json({ mensaje: "Contraseña actualizada correctamente" });
    } catch (error) {
      return res
        .status(500)
        .json({ error: `Error al actualizar contraseña: ${error.message}` });
    }
  }

  static async currentUsuario(req, res) {
    res.status(200).json({ usuario: req.user });
  }
}
