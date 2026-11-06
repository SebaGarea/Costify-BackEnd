import { body, param, validationResult } from "express-validator";
import logger from '../../config/logger.js';

export const validacionRegistro = [
  body("email").trim().isEmail().withMessage("Email inválido"),
  body("password").isLength({ min: 8, max: 128 }).withMessage("La contraseña debe tener entre 8 y 128 caracteres"),
  body("first_name").notEmpty().withMessage("El nombre es obligatorio"),
  body("last_name").notEmpty().withMessage("El apellido es obligatorio"),
  body("invitationCode").notEmpty().withMessage("El código de invitación es obligatorio"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validación de registro fallida', { errores: errors.array() });
      return res.status(400).json({ errores: errors.array() });
    }
    next();
  },
];


export const validacionLogin = [
    body("email").trim().isEmail().withMessage("Email inválido"),
    body("password").isLength({ min: 1, max: 128 }).withMessage("La contraseña es obligatoria"),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.warn('Validación de login fallida', { errores: errors.array() });
        return res.status(400).json({ errores: errors.array() });
      }
      next();
    },
]

export const validacionUpdate = [
  param("id").isMongoId().withMessage("ID inválido"),
  body("email").optional().isEmail().withMessage("Email inválido"),
  body("password").optional().isLength({ min: 8, max: 128 }).withMessage("La contraseña debe tener entre 8 y 128 caracteres"),
  body("first_name").optional().notEmpty().withMessage("El nombre es obligatorio"),
  body("last_name").optional().notEmpty().withMessage("El apellido es obligatorio"),
  body("role").optional().isIn(["user", "admin"]).withMessage("Rol inválido"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validación de actualización fallida', { errores: errors.array() });
      return res.status(400).json({ errores: errors.array() });
    }
    next();
  },
];

export const validacionIdUser = [
  param("id").isMongoId().withMessage("ID inválido"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validación de ID de usuario fallida', { errores: errors.array() });
      return res.status(400).json({ errores: errors.array() });
    }
    next();
  },
];

export const validacionSetPassword = [
  body("email").trim().isEmail().withMessage("Email inválido"),
  body("password").isLength({ min: 8, max: 128 }).withMessage("La contraseña debe tener entre 8 y 128 caracteres"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validación de establecimiento de contraseña fallida', { errores: errors.array() });
      return res.status(400).json({ errores: errors.array() });
    }
    next();
  },
];

export const validacionChangePassword = [
  body("currentPassword").isLength({ min: 1, max: 128 }).withMessage("La contraseña actual es obligatoria"),
  body("newPassword")
    .isLength({ min: 8, max: 128 })
    .withMessage("La nueva contraseña debe tener entre 8 y 128 caracteres")
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error("La nueva contraseña debe ser distinta a la actual");
      }
      return true;
    }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validación de cambio de contraseña fallida', { errores: errors.array() });
      return res.status(400).json({ errores: errors.array() });
    }
    next();
  },
];

export const validacionPerfil = [
  body("avatar")
    .optional({ nullable: true })
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage("La URL del avatar es inválida"),
  body("themePreference")
    .optional({ nullable: true })
    .isIn(["light", "dark"])
    .withMessage("El tema debe ser 'light' o 'dark'"),
  body("statusMessage")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 160 })
    .withMessage("El mensaje personal debe tener máximo 160 caracteres"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validación de perfil fallida', { errores: errors.array() });
      return res.status(400).json({ errores: errors.array() });
    }
    next();
  },
];