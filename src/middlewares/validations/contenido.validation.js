import { body, param, query, validationResult } from "express-validator";
import logger from "../../config/logger.js";

const ESTADOS = ["idea", "produccion", "edicion", "listo", "publicado"];
const CANALES = ["instagram", "facebook", "tiktok", "tiendanube"];
const TIPOS = ["foto", "reel", "carrusel", "historia", "otro"];

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn("Validación de contenido fallida", { errores: errors.array() });
    return res.status(400).json({ errores: errors.array() });
  }
  next();
};

const checklistValidator = (value) =>
  value.every(
    (item) =>
      item && typeof item === "object" && typeof item.text === "string"
  );

export const validacionCreateContenido = [
  body("titulo").notEmpty().withMessage("El título es obligatorio"),
  body("estado").optional().isIn(ESTADOS).withMessage("Estado inválido"),
  body("canales")
    .optional()
    .isArray()
    .withMessage("canales debe ser un array")
    .bail()
    .custom((arr) => arr.every((c) => CANALES.includes(c)))
    .withMessage("Canales inválidos"),
  body("tipo").optional().isIn(TIPOS).withMessage("Tipo inválido"),
  body("fechaPublicacion").optional({ checkFalsy: true }).isISO8601().withMessage("Fecha inválida"),
  body("producto").optional({ checkFalsy: true }).isMongoId().withMessage("Producto inválido"),
  body("responsable").optional({ checkFalsy: true }).isMongoId().withMessage("Responsable inválido"),
  body("copy").optional().isString().withMessage("Copy inválido"),
  body("notas").optional().isString().withMessage("Notas inválidas"),
  body("checklist")
    .optional()
    .isArray()
    .withMessage("checklist debe ser un array")
    .bail()
    .custom(checklistValidator)
    .withMessage("Checklist inválido"),
  body("orden").optional().isNumeric().withMessage("orden inválido"),
  body("enlaces")
    .optional()
    .isArray()
    .withMessage("enlaces debe ser un array")
    .bail()
    .custom((arr) => arr.every((e) => e && typeof e === "object" && typeof e.url === "string" && e.url.trim()))
    .withMessage("Cada enlace necesita una url"),
  handleValidation,
];

export const validacionUpdateContenido = [
  param("id").isMongoId().withMessage("ID inválido"),
  body("titulo").optional().notEmpty().withMessage("El título no puede estar vacío"),
  body("estado").optional().isIn(ESTADOS).withMessage("Estado inválido"),
  body("canales")
    .optional()
    .isArray()
    .withMessage("canales debe ser un array")
    .bail()
    .custom((arr) => arr.every((c) => CANALES.includes(c)))
    .withMessage("Canales inválidos"),
  body("tipo").optional().isIn(TIPOS).withMessage("Tipo inválido"),
  body("fechaPublicacion").optional({ checkFalsy: true }).isISO8601().withMessage("Fecha inválida"),
  body("producto").optional({ checkFalsy: true }).isMongoId().withMessage("Producto inválido"),
  body("responsable").optional({ checkFalsy: true }).isMongoId().withMessage("Responsable inválido"),
  body("copy").optional().isString().withMessage("Copy inválido"),
  body("notas").optional().isString().withMessage("Notas inválidas"),
  body("checklist")
    .optional()
    .isArray()
    .withMessage("checklist debe ser un array")
    .bail()
    .custom(checklistValidator)
    .withMessage("Checklist inválido"),
  body("orden").optional().isNumeric().withMessage("orden inválido"),
  body("enlaces")
    .optional()
    .isArray()
    .withMessage("enlaces debe ser un array")
    .bail()
    .custom((arr) => arr.every((e) => e && typeof e === "object" && typeof e.url === "string" && e.url.trim()))
    .withMessage("Cada enlace necesita una url"),
  handleValidation,
];

export const validacionIdContenido = [
  param("id").isMongoId().withMessage("ID inválido"),
  handleValidation,
];

export const validacionQueryContenido = [
  query("estado").optional().isIn(ESTADOS).withMessage("Estado inválido"),
  query("canal").optional().isIn(CANALES).withMessage("Canal inválido"),
  query("responsable").optional().isMongoId().withMessage("Responsable inválido"),
  query("producto").optional().isMongoId().withMessage("Producto inválido"),
  query("sort")
    .optional()
    .isIn(["createdAt", "updatedAt", "fechaPublicacion", "kanban"])
    .withMessage("sort inválido"),
  query("page").optional().isInt({ min: 1 }).withMessage("page inválido"),
  query("limit").optional().isInt({ min: 1, max: 500 }).withMessage("limit inválido"),
  handleValidation,
];
