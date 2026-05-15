import { body, param, query, validationResult } from "express-validator";
import logger from "../../config/logger.js";

const HORA_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn("Validación de eventos fallida", { errores: errors.array() });
    return res.status(400).json({ errores: errors.array() });
  }
  next();
};

const validarHora = (value) => {
  if (value === undefined || value === null || value === "") return true;
  return HORA_REGEX.test(value);
};

export const validacionCreateEvento = [
  body("title").notEmpty().withMessage("El título es obligatorio"),
  body("description").optional().isString().withMessage("Descripción inválida"),
  body("fecha").notEmpty().withMessage("La fecha es obligatoria").bail().isISO8601().withMessage("Fecha inválida"),
  body("hora").optional({ checkFalsy: true }).custom(validarHora).withMessage("Hora inválida (formato HH:MM)"),
  handleValidation,
];

export const validacionUpdateEvento = [
  param("id").isMongoId().withMessage("ID inválido"),
  body("title").optional().notEmpty().withMessage("El título no puede estar vacío"),
  body("description").optional().isString().withMessage("Descripción inválida"),
  body("fecha").optional().isISO8601().withMessage("Fecha inválida"),
  body("hora").optional({ checkFalsy: true }).custom(validarHora).withMessage("Hora inválida (formato HH:MM)"),
  handleValidation,
];

export const validacionIdEvento = [
  param("id").isMongoId().withMessage("ID inválido"),
  handleValidation,
];

export const validacionQueryEventos = [
  query("desde").optional().isISO8601().withMessage("desde inválido"),
  query("hasta").optional().isISO8601().withMessage("hasta inválido"),
  handleValidation,
];
