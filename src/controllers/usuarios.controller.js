import { usuariosService } from "../services/usuarios.service.js";
import { UsuarioDTO } from "../dtos/usuarios.dto.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import logger from "../config/logger.js";
dotenv.config();

export default class UsuariosController {
  static async getUsuarios(req, res, next) {
    try {
      let usuarios = await usuariosService.getUsuarios();
      let usuariosDTO = UsuarioDTO.fromArray(usuarios);

      logger.info("Usuarios obtenidos exitosamente",{cantidad: usuariosDTO.length});

      res.setHeader("Content-Type", "application/json");
      return res.status(200).json({
        status: "success",
        usuarios: usuariosDTO,
      });
    } catch (error) {
      logger.error('Error al obtener usuarios', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  static async getUsuariosById(req, res, next) {
  let { id } = req.params;
  try {
    let usuario = await usuariosService.getUsuariosById(id);
    if (!usuario) {
      logger.warn('Usuario no encontrado', { id });
      const error = new Error("Usuario no encontrado");
      error.status = 404;
      return next(error);
    }
    let usuarioDTO = UsuarioDTO.fromObject(usuario);
    logger.info('Usuario obtenido por ID', { id });
    res.setHeader("Content-Type", "application/json");
    return res.status(200).json({ succes: "succes", usuario: usuarioDTO });
  } catch (error) {
    logger.error('Error al obtener usuario por ID', { id, error: error.message, stack: error.stack });
    next(error);
  }
}

  static async updateUsuario(req, res, next) {
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
      logger.warn('Intento de actualizar usuario no existente', { id });   
      const error = new Error(`No se encontró ningún usuario con el ID: ${id}`);
      error.status = 404;
      return next(error);
    }

      let usuarioDTO = UsuarioDTO.fromObject(usuarioActualizado);

      logger.info('Usuario actualizado exitosamente', { id });

      res.setHeader("Content-Type", "application/json");
      return res.status(200).json({
        status: "succes",
        usuario: usuarioDTO,
      });
    } catch (error) {
      logger.error('Error al actualizar usuario', { id, error: error.message, stack: error.stack });
      next(error);
    }
  }

  static async deleteUsuario(req, res, next) {
    let { id } = req.params;
    try {
      let usuario = await usuariosService.delete(id);
      if (!usuario) {
      logger.warn('Intento de eliminar usuario no existente', { id });
      const error = new Error(`No se encontró ningún usuario con el ID: ${id}`);
      error.status = 404;
      return next(error);
    }
      let usuarioDTO = UsuarioDTO.fromObject(usuario);

      logger.info('Usuario eliminado exitosamente', { id });

      res.setHeader("Content-Type", "application/json");
      return res.status(200).json({ payload: "succes", usuario: usuarioDTO });
    } catch (error) {
      logger.error('Error al eliminar usuario', { id, error: error.message, stack: error.stack });
      next(error);
    }
  }

  static async loginUsuario(req, res) {
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, {
      expiresIn: "8h",
    });
    logger.info('Login local exitoso', { id: req.user._id });
    res.json({ mensaje: "Login local exitoso", token, usuario: req.user });
  }

  static async loginGoogleCallback(req, res) {
    try {
      const token = jwt.sign(
        { id: req.user._id, role: req.user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );
      logger.info('Login con Google exitoso', { id: req.user._id });
      return res.redirect(`http://localhost:8080/?token=${token}`);    
    } catch (error) {
      logger.error('Error en loginGoogleCallback', { error: error.message, stack: error.stack });
      res.status(500).json({ error: "Error en login con Google" });
    }
  }

  static async registroUsuario(req, res) {
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({ mensaje: "Registro exitoso", token, usuario: req.user });
    logger.info('Usuario registrado exitosamente', { id: req.user._id });
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
    logger.info('Usuario actual obtenido', { id: req.user._id });
  }
}
