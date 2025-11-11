import { Router } from "express";
import { ventasController } from "../controllers/ventas.controller.js";
import { validacionCreateVenta, validacionUpdateVenta, validacionIdVenta, validacionClienteId, validacionEstadoVenta } from "../middlewares/validations/ventas.validation.js";
export const router = Router();
import passport from "passport";


router.post("/",passport.authenticate("jwt", { session: false }),validacionCreateVenta, ventasController.createVenta);
router.get("/",passport.authenticate("jwt", { session: false }), ventasController.getAllVentas);
router.get("/:id",passport.authenticate("jwt", { session: false }), validacionIdVenta, ventasController.getVentaById);
router.put("/:id",passport.authenticate("jwt", { session: false }),validacionUpdateVenta, ventasController.updateVenta);
router.delete("/:id",passport.authenticate("jwt", { session: false }), validacionIdVenta,ventasController.deleteVenta);
router.get("/cliente/:clienteId",passport.authenticate("jwt", { session: false }),validacionClienteId, ventasController.getVentasByCliente);
router.get("/estado/:estado",passport.authenticate("jwt", { session: false }), validacionEstadoVenta,ventasController.getVentasByEstado);