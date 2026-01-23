import crypto from "crypto";
import { usuariosService, invitacionesService } from "../services/index.js";
import { generaHash, validaHash } from "../config/index.js";
import { UsuarioDTO } from "../dtos/usuarios.dto.js";

import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import logger from "../config/logger.js";
dotenv.config();

const sanitizeUser = (usuario) => {
  if (!usuario) return null;
  const {
    password,
    verificationToken,
    verificationExpires,
    __v,
    ...rest
  } = usuario;
  return rest;
};

const normalizeOrigin = (value) => {
  if (!value) return null;
  try {
    const decoded = typeof value === "string" ? decodeURIComponent(value) : value;
    const url = new URL(decoded);
    return url.origin;
  } catch (error) {
    return null;
  }
};

const getAllowedFrontendOrigins = () => {
  const primary = process.env.FRONTEND_URL || "http://localhost:5173";
  const extra = process.env.FRONTEND_URLS
    ? process.env.FRONTEND_URLS.split(",").map((entry) => entry.trim()).filter(Boolean)
    : [];
  const origins = new Set();

  [primary, ...extra].forEach((entry) => {
    const origin = normalizeOrigin(entry);
    if (origin) origins.add(origin);
  });

  if (!origins.size) {
    origins.add("http://localhost:5173");
  }

  return Array.from(origins);
};

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const buildFrontendRedirect = (path = "") => {
  const base = getAllowedFrontendOrigins()[0];
  return `${base}${path}`;
};

export class UsuariosController {
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
    const usuario = sanitizeUser(req.user);
    res.json({ mensaje: "Login local exitoso", token, usuario });
  }

  static async loginGoogleCallback(req, res) {
    try {
      const token = jwt.sign(
        { id: req.user._id, role: req.user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );
      logger.info('Login con Google exitoso', { id: req.user._id });
      const allowedOrigins = getAllowedFrontendOrigins();
      const fallbackOrigin = allowedOrigins[0];
      const requestedOrigin = normalizeOrigin(req.query.state);
      const targetOrigin = allowedOrigins.includes(requestedOrigin)
        ? requestedOrigin
        : fallbackOrigin;
      return res.redirect(`${targetOrigin}/?token=${token}`);
    } catch (error) {
      logger.error('Error en loginGoogleCallback', { error: error.message, stack: error.stack });
      res.status(500).json({ error: "Error en login con Google" });
    }
  }

  static async registroUsuario(req, res) {
    const { first_name, last_name, email, password, invitationCode } = req.body;

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const invitation = await invitacionesService.validateInvitation(invitationCode, normalizedEmail);
      const existente = await usuariosService.getUsuarioByEmail(normalizedEmail);
      if (existente) {
        return res.status(409).json({ mensaje: "El email ya se encuentra registrado" });
      }

      const usuario = await usuariosService.createUsuario({
        first_name,
        last_name,
        email: normalizedEmail,
        password,
        role: invitation.role || "user",
        emailVerified: true,
        verificationToken: null,
        verificationExpires: null,
        invitationCode: invitation.code,
      });

      await invitacionesService.markInvitationUsed(invitation._id, usuario._id);

      logger.info('Usuario registrado con invitación', { id: usuario._id });
      return res.status(201).json({ mensaje: "Registro exitoso. Ya puedes iniciar sesión." });
    } catch (error) {
      logger.error('Error en registro con invitación', { error: error.message, stack: error.stack });
      return res.status(400).json({ error: error.message });
    }
  }

  static async verifyEmail(req, res) {
    const { token } = req.query;
    const redirectBase = buildFrontendRedirect("/login");
    if (!token) {
      return res.redirect(`${redirectBase}?verified=missing`);
    }

    try {
      const tokenHash = hashToken(token);
      const usuario = await usuariosService.usuariosDAO.getBy({ verificationToken: tokenHash });
      if (!usuario) {
        return res.redirect(`${redirectBase}?verified=invalid`);
      }
      if (usuario.emailVerified) {
        return res.redirect(`${redirectBase}?verified=already`);
      }
      if (usuario.verificationExpires && new Date(usuario.verificationExpires) < new Date()) {
        return res.redirect(`${redirectBase}?verified=expired`);
      }

      await usuariosService.usuariosDAO.update(usuario._id, {
        emailVerified: true,
        verificationToken: null,
        verificationExpires: null,
      });
      logger.info('Correo verificado', { id: usuario._id });
      return res.redirect(`${redirectBase}?verified=success`);
    } catch (error) {
      logger.error('Error verificando correo', { error: error.message, stack: error.stack });
      return res.redirect(`${redirectBase}?verified=error`);
    }
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

  static async changePassword(req, res) {
    const { currentPassword, newPassword } = req.body;
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({ error: "No autorizado" });
      }

      const usuario = await usuariosService.usuariosDAO.getById(userId);
      if (!usuario) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      const isMatch = validaHash(currentPassword, usuario.password);
      if (!isMatch) {
        return res.status(400).json({ error: "La contraseña actual no es correcta" });
      }

      await usuariosService.usuariosDAO.update(userId, {
        password: generaHash(newPassword),
      });

      logger.info("Contraseña actualizada", { id: userId });
      return res.status(200).json({ mensaje: "Contraseña actualizada correctamente" });
    } catch (error) {
      logger.error("Error al cambiar contraseña", { error: error.message, stack: error.stack });
      return res.status(500).json({ error: "No se pudo actualizar la contraseña" });
    }
  }

  static async updatePerfil(req, res, next) {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({ error: "No autorizado" });
      }

      const { avatar, themePreference, statusMessage } = req.body;
      const updates = {};

      if (typeof avatar !== "undefined") updates.avatar = avatar;
      if (typeof themePreference !== "undefined") updates.themePreference = themePreference;
      if (typeof statusMessage !== "undefined") updates.statusMessage = statusMessage?.trim() ?? "";

      if (!Object.keys(updates).length) {
        return res.status(400).json({ error: "No se recibieron cambios para actualizar" });
      }

      const usuarioActualizado = await usuariosService.updateUsuario(userId, updates);
      if (!usuarioActualizado) {
        logger.warn('Intento de actualizar perfil con usuario inexistente', { id: userId });
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      const usuario = sanitizeUser(usuarioActualizado);
      logger.info('Perfil de usuario actualizado', { id: userId });
      return res.status(200).json({ mensaje: "Perfil actualizado", usuario });
    } catch (error) {
      logger.error('Error al actualizar perfil', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  static async crearInvitacion(req, res) {
    try {
      const { email, role = "user", maxUses = 1, expiresAt } = req.body;
      const invitacion = await invitacionesService.createInvitation(
        { email, role, maxUses, expiresAt },
        req.user._id
      );
      return res.status(201).json({ mensaje: "Invitación generada", invitacion });
    } catch (error) {
      logger.error('Error al crear invitación', { error: error.message, stack: error.stack });
      return res.status(400).json({ error: error.message });
    }
  }

  static async listarInvitaciones(req, res) {
    try {
      const invitaciones = await invitacionesService.listInvitations();
      return res.status(200).json({ invitaciones });
    } catch (error) {
      logger.error('Error al listar invitaciones', { error: error.message, stack: error.stack });
      return res.status(500).json({ error: "No se pudieron obtener las invitaciones" });
    }
  }

  static async currentUsuario(req, res) {
    const usuario = sanitizeUser(req.user);
    res.status(200).json({ usuario });
    logger.info('Usuario actual obtenido', { id: req.user._id });
  }
}
