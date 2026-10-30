import { Router } from "express";
import passport from "passport";
import { cajaController, mercadoPagoWebhook } from "../controllers/index.js";
import {
  validacionId,
  validacionMovimiento,
  validacionQueryMovimientos,
  validacionResumen,
  validacionCuenta,
  validacionAjuste,
  validacionCategoria,
  validacionCompra,
} from "../middlewares/validations/caja.validation.js";

export const router = Router();

const auth = passport.authenticate("jwt", { session: false });

router.get("/resumen", auth, validacionResumen, cajaController.resumen);

router.get("/cuentas", auth, cajaController.listarCuentas);
router.post("/cuentas", auth, validacionCuenta, cajaController.crearCuenta);
router.put("/cuentas/:id", auth, validacionId, validacionCuenta, cajaController.actualizarCuenta);
router.post("/cuentas/:id/ajuste", auth, validacionAjuste, cajaController.ajustarSaldo);

router.get("/categorias", auth, cajaController.listarCategorias);
router.post("/categorias", auth, validacionCategoria, cajaController.crearCategoria);
router.put("/categorias/:id", auth, validacionId, validacionCategoria, cajaController.actualizarCategoria);
router.delete("/categorias/:id", auth, validacionId, cajaController.eliminarCategoria);

router.get("/movimientos", auth, validacionQueryMovimientos, cajaController.listarMovimientos);
router.post("/movimientos", auth, validacionMovimiento, cajaController.crearMovimiento);
router.put("/movimientos/:id", auth, validacionId, validacionMovimiento, cajaController.actualizarMovimiento);
router.delete("/movimientos/:id", auth, validacionId, cajaController.eliminarMovimiento);

router.post("/compras", auth, validacionCompra, cajaController.registrarCompra);

router.get("/mercadopago", auth, cajaController.mercadoPagoEstado);
// Sin login: lo llama Mercado Pago. Se valida con la firma (MP_WEBHOOK_SECRET).
router.post("/mercadopago/webhook", mercadoPagoWebhook);
router.post("/mercadopago/sync", auth, cajaController.mercadoPagoSync);
