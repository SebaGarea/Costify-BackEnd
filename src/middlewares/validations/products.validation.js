import {body, param, validationResult} from 'express-validator';

export const validacionCreateProducto = [
  body("nombre").notEmpty().withMessage("El nombre es obligatorio"),
  body("catalogo").notEmpty().withMessage("El catálogo es obligatorio"),
  body("modelo").notEmpty().withMessage("El modelo es obligatorio"),
  body("precio").isFloat({ min: 0 }).withMessage("El precio debe ser un número positivo"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errores: errors.array() });
    }
    next();
  },
];

export const validacionUpdateProducto = [
  param("id").isMongoId().withMessage("ID inválido"),
  body("nombre").optional().notEmpty().withMessage("El nombre es obligatorio"),
  body("catalogo").optional().notEmpty().withMessage("El catálogo es obligatorio"),
  body("modelo").optional().notEmpty().withMessage("El modelo es obligatorio"),
  body("precio").optional().isFloat({ min: 0 }).withMessage("El precio debe ser un número positivo"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errores: errors.array() });
    }
    next();
  },
];

export const validacionIdProducto = [
  param("id").isMongoId().withMessage("ID inválido"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errores: errors.array() });
    }
    next();
  },
];