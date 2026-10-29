import { body, param, query, validationResult } from "express-validator";
import logger from "../../config/logger.js";

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn("Validación de caja fallida", { errores: errors.array() });
    return res.status(400).json({
      mensaje: errors.array()[0]?.msg || "Datos inválidos",
      errores: errors.array(),
    });
  }
  next();
};

const fecha = (campo, ubicacion = body) =>
  ubicacion(campo).optional({ checkFalsy: true }).isISO8601().withMessage(`Fecha inválida (${campo})`);

export const validacionId = [param("id").isMongoId().withMessage("ID inválido"), handleValidation];

export const validacionMovimiento = [
  body("tipo").optional().isIn(["ingreso", "egreso", "transferencia"]).withMessage("Tipo inválido"),
  body("monto").optional().isFloat({ gt: 0 }).withMessage("El monto debe ser mayor a cero"),
  body("cuenta").optional().isMongoId().withMessage("Cuenta inválida"),
  body("cuentaDestino")
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage("Cuenta de destino inválida"),
  body("categoria")
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage("Categoría inválida"),
  fecha("fecha"),
  body("descripcion").optional().isString().isLength({ max: 500 }).withMessage("Descripción demasiado larga"),
  handleValidation,
];

export const validacionQueryMovimientos = [
  fecha("desde", query),
  fecha("hasta", query),
  query("cuenta").optional({ checkFalsy: true }).isMongoId().withMessage("Cuenta inválida"),
  query("categoria").optional({ checkFalsy: true }).isMongoId().withMessage("Categoría inválida"),
  query("page").optional().isInt({ min: 1 }).withMessage("page inválido"),
  query("limit").optional().isInt({ min: 1, max: 500 }).withMessage("limit inválido"),
  handleValidation,
];

export const validacionResumen = [fecha("desde", query), fecha("hasta", query), handleValidation];

export const validacionCuenta = [
  body("nombre").optional().isString().isLength({ max: 60 }).withMessage("Nombre inválido"),
  body("tipo").optional().isIn(["efectivo", "billetera", "banco"]).withMessage("Tipo de cuenta inválido"),
  body("saldoInicial").optional().isFloat().withMessage("Saldo inicial inválido"),
  fecha("fechaSaldoInicial"),
  handleValidation,
];

export const validacionAjuste = [
  param("id").isMongoId().withMessage("ID inválido"),
  body("saldoReal").isFloat().withMessage("El saldo real es inválido"),
  handleValidation,
];

export const validacionCategoria = [
  body("nombre").optional().isString().isLength({ max: 60 }).withMessage("Nombre inválido"),
  body("tipo").optional().isIn(["ingreso", "egreso"]).withMessage("Tipo inválido"),
  handleValidation,
];

export const validacionCompra = [
  body("cuenta").isMongoId().withMessage("Elegí con qué cuenta se pagó"),
  body("total").isFloat({ gt: 0 }).withMessage("El total debe ser mayor a cero"),
  body("items").optional().isArray({ max: 200 }).withMessage("Ítems inválidos"),
  fecha("fecha"),
  handleValidation,
];
