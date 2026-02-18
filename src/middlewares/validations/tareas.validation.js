import { body, param, query, validationResult } from "express-validator";
import logger from "../../config/logger.js";

const TAGS = ["presupuesto", "cliente", "otros"];
const STATUS = ["pendiente", "hecho"];
const PRIORITY = ["baja", "media", "alta"];

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn("Validación de tareas fallida", { errores: errors.array() });
    return res.status(400).json({ errores: errors.array() });
  }
  next();
};

export const validacionCreateTarea = [
  body("title").notEmpty().withMessage("El título es obligatorio"),
  body("notes").optional().isString().withMessage("Notas inválidas"),
  body("status").optional().isIn(STATUS).withMessage("Estado inválido"),
  body("priority").optional().isIn(PRIORITY).withMessage("Prioridad inválida"),
  body("dueDate").optional({ checkFalsy: true }).isISO8601().withMessage("dueDate inválido"),
  body("tags")
    .optional()
    .isArray()
    .withMessage("tags debe ser un array")
    .bail()
    .custom((tags) => tags.every((t) => TAGS.includes(t)))
    .withMessage("Tags inválidos"),
  handleValidation,
];

export const validacionUpdateTarea = [
  param("id").isMongoId().withMessage("ID inválido"),
  body("title").optional().notEmpty().withMessage("El título no puede estar vacío"),
  body("notes").optional().isString().withMessage("Notas inválidas"),
  body("status").optional().isIn(STATUS).withMessage("Estado inválido"),
  body("priority").optional().isIn(PRIORITY).withMessage("Prioridad inválida"),
  body("dueDate").optional({ checkFalsy: true }).isISO8601().withMessage("dueDate inválido"),
  body("tags")
    .optional()
    .isArray()
    .withMessage("tags debe ser un array")
    .bail()
    .custom((tags) => tags.every((t) => TAGS.includes(t)))
    .withMessage("Tags inválidos"),
  handleValidation,
];

export const validacionIdTarea = [
  param("id").isMongoId().withMessage("ID inválido"),
  handleValidation,
];

export const validacionQueryTareas = [
  query("status").optional().isIn(STATUS).withMessage("Estado inválido"),
  query("priority").optional().isIn(PRIORITY).withMessage("Prioridad inválida"),
  query("tag").optional().isIn(TAGS).withMessage("Tag inválido"),
  query("sort").optional().isIn(["createdAt", "updatedAt", "dueDate"]).withMessage("sort inválido"),
  query("page").optional().isInt({ min: 1 }).withMessage("page inválido"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("limit inválido"),
  handleValidation,
];
