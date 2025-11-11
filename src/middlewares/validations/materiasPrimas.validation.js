import { body, param, validationResult } from "express-validator";

export const validacionCreateMateriaPrima = [
  body("nombre").notEmpty().withMessage("El nombre es obligatorio"),
  body("categoria").notEmpty().withMessage("La categoría es obligatoria"),
  body("tipo").notEmpty().withMessage("El tipo es obligatorio"),
  body("unidad").notEmpty().withMessage("La unidad es obligatoria"),
  body("precio").isFloat({ min: 0 }).withMessage("El precio debe ser un número positivo"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errores: errors.array() });
    }
    next();
  },
];

export const validacionUpdateMateriaPrima = [
  param("id").isMongoId().withMessage("ID inválido"),
  body("nombre").optional().notEmpty().withMessage("El nombre es obligatorio"),
  body("categoria").optional().notEmpty().withMessage("La categoría es obligatoria"),
  body("tipo").optional().notEmpty().withMessage("El tipo es obligatorio"),
  body("unidad").optional().notEmpty().withMessage("La unidad es obligatoria"),
  body("precio").optional().isFloat({ min: 0 }).withMessage("El precio debe ser un número positivo"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errores: errors.array() });
    }
    next();
  },
];

export const validacionIdMateriaPrima = [
  param("id").isMongoId().withMessage("ID inválido"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errores: errors.array() });
    }
    next();
  },
];

export const validacionCategory = [
  param("category").notEmpty().withMessage("La categoría es obligatoria"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errores: errors.array() });
    }
    next();
  },
];

export const validacionType = [
  param("type").notEmpty().withMessage("El tipo es obligatorio"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errores: errors.array() });
    }
    next();
  },
];