import { body, param, validationResult } from "express-validator";
import logger from '../../config/logger.js';

export const validacionCreateVenta = [
  body("cliente").notEmpty().withMessage("El cliente es obligatorio"),
  body("medio").notEmpty().withMessage("El medio es obligatorio"),
  body("productoId").isMongoId().withMessage("El productoId debe ser válido"),
  body("cantidad").isInt({ min: 1 }).withMessage("La cantidad debe ser mayor a cero"),
  body("valorEnvio").optional().isFloat({ min: 0 }).withMessage("El valor de envío debe ser positivo"),
  body("seña").optional().isFloat({ min: 0 }).withMessage("La seña debe ser positiva"),
  body("estado").optional().isIn(["pendiente", "en_proceso", "finalizada", "despachada", "cancelada"]).withMessage("Estado inválido"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validación de creación de venta fallida', { errores: errors.array() });
      return res.status(400).json({ errores: errors.array() });
    }
    next();
  },
];

export const validacionUpdateVenta = [
  param("id").isMongoId().withMessage("ID inválido"),
  body("cliente").optional().notEmpty().withMessage("El cliente es obligatorio"),
  body("medio").optional().notEmpty().withMessage("El medio es obligatorio"),
  body("productoId").optional().isMongoId().withMessage("El productoId debe ser válido"),
  body("cantidad").optional().isInt({ min: 1 }).withMessage("La cantidad debe ser mayor a cero"),
  body("valorEnvio").optional().isFloat({ min: 0 }).withMessage("El valor de envío debe ser positivo"),
  body("seña").optional().isFloat({ min: 0 }).withMessage("La seña debe ser positiva"),
  body("estado").optional().isIn(["pendiente", "en_proceso", "finalizada", "despachada", "cancelada"]).withMessage("Estado inválido"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validación de actualización de venta fallida', { errores: errors.array() });
      return res.status(400).json({ errores: errors.array() });
    }
    next();
  },
];

export const validacionIdVenta = [
  param("id").isMongoId().withMessage("ID inválido"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validación de ID de venta fallida', { errores: errors.array() });
      return res.status(400).json({ errores: errors.array() });
    }
    next();
  },
]

  export const validacionClienteId = [
  param("clienteId").isMongoId().withMessage("ID de cliente inválido"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validación de ID de cliente fallida', { errores: errors.array() });
      return res.status(400).json({ errores: errors.array() });
    }
    next();
  },
];

export const validacionEstadoVenta = [
  param("estado")
    .isIn(["pendiente", "en_proceso", "finalizada", "despachada", "cancelada"])
    .withMessage("Estado inválido"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validación de estado de venta fallida', { errores: errors.array() });
      return res.status(400).json({ errores: errors.array() });
    }
    next();
  },
];