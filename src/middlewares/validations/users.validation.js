import { body, param, validationResult } from "express-validator";
import logger from '../../config/logger.js';

export const validacionRegistro = [
  body("email").isEmail().withMessage("Email inválido"),
  body("password").isLength({ min: 6 }).withMessage("La contraseña debe tener al menos 6 caracteres"),
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
    body("email").isEmail().withMessage("Email inválido"),
    body("password").notEmpty().withMessage("La contraseña es obligatoria"),
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
  body("password").optional().isLength({ min: 6 }).withMessage("La contraseña debe tener al menos 6 caracteres"),
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
  body("email").isEmail().withMessage("Email inválido"),
  body("password").isLength({ min: 6 }).withMessage("La contraseña debe tener al menos 6 caracteres"),
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
  body("currentPassword").isLength({ min: 6 }).withMessage("La contraseña actual es obligatoria"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("La nueva contraseña debe tener al menos 6 caracteres")
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