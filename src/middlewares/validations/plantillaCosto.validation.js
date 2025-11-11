import {body, param, validationResult} from 'express-validator';

export const validacionCreatePlantillaCosto = [
    param("id").isMongoId().withMessage("ID inválido"),
    body("nombre").optional().notEmpty().withMessage("El nombre es obligatorio"),
    body("items").optional().isArray({ min: 1 }).withMessage("Debe haber al menos un item"),
    body("items.*.materiaPrima").optional().notEmpty().withMessage("Cada item debe tener materiaPrima"),
    body("items.*.cantidad").optional().isFloat({ min: 0.01 }).withMessage("La cantidad debe ser mayor a 0"),
    body("items.*.categoria").optional().notEmpty().withMessage("Cada item debe tener una categoría"),
    body("porcentajesPorCategoria").optional().custom(value => {
        if (typeof value !== 'object' || Array.isArray(value)) throw new Error("porcentajesPorCategoria debe ser un objeto");
        return true;
    }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
        return res.status(400).json({ errores: errors.array() });
        }
        next();
    }
]

export const validacionIdPlantillaCosto = [
  param("id").isMongoId().withMessage("ID inválido"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errores: errors.array() });
    }
    next();
  }
];