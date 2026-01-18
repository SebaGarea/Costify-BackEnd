import {body, param, validationResult} from 'express-validator';

import logger from '../../config/logger.js';

export const validacionCreatePlantillaCosto = [
  body("nombre").notEmpty().withMessage("El nombre es obligatorio"),
  body("items").isArray({ min: 1 }).withMessage("Debe haber al menos un item"),
  body("items").custom((items) => {
    items.forEach((item, index) => {
      const tieneMateriaPrima = Boolean(item?.materiaPrima);
      const tieneValor = item?.valor !== undefined && item?.valor !== null;
      if (!tieneMateriaPrima && !tieneValor) {
        throw new Error(`El item ${index + 1} debe tener materiaPrima o un valor personalizado`);
      }
    });
    return true;
  }),
  body("items.*.cantidad").isFloat({ min: 0.01 }).withMessage("La cantidad debe ser mayor a 0"),
  body("items.*.categoria").notEmpty().withMessage("Cada item debe tener una categoría"),
  body("porcentajesPorCategoria")
    .optional()
    .custom((value) => {
      if (typeof value !== "object" || Array.isArray(value)) {
        throw new Error("porcentajesPorCategoria debe ser un objeto");
      }
      return true;
    }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn("Validación de creación de plantilla de costo fallida", { errores: errors.array() });
      return res.status(400).json({ errores: errors.array() });
    }
    next();
  },
];

export const validacionIdPlantillaCosto = [
  param("id").isMongoId().withMessage("ID inválido"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validación de ID de plantilla de costo fallida', { errores: errors.array() });
      return res.status(400).json({ errores: errors.array() });
    }
    next();
  }
];

export const validacionUpdatePlantillaCosto = [
  param("id").isMongoId().withMessage("ID inválido"),
  body("nombre").optional().notEmpty().withMessage("El nombre es obligatorio"),
  body("items").optional().isArray({ min: 1 }).withMessage("Debe haber al menos un item"),
  body("items").optional().custom((items) => {
    items.forEach((item, index) => {
      const tieneMateriaPrima = Boolean(item?.materiaPrima);
      const tieneValor = item?.valor !== undefined && item?.valor !== null;
      if (!tieneMateriaPrima && !tieneValor) {
        throw new Error(`El item ${index + 1} debe tener materiaPrima o un valor personalizado`);
      }
    });
    return true;
  }),
  body("items.*.cantidad").optional().isFloat({ min: 0.01 }).withMessage("La cantidad debe ser mayor a 0"),
  body("items.*.categoria").optional().notEmpty().withMessage("Cada item debe tener una categoría"),
  body("porcentajesPorCategoria").optional().custom(value => {
    if (typeof value !== 'object' || Array.isArray(value)) throw new Error("porcentajesPorCategoria debe ser un objeto");
    return true;
  }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validación de actualización de plantilla de costo fallida', { errores: errors.array() });
      return res.status(400).json({ errores: errors.array() });
    }
    next();
  }
];