import { Router } from "express";
import { ventasController } from "../controllers/ventas.controller.js";
export const router = Router();
import passport from "passport";


router.post("/",passport.authenticate("jwt", { session: false }), ventasController.createVenta);
router.get("/",passport.authenticate("jwt", { session: false }), ventasController.getAllVentas);
router.get("/:id",passport.authenticate("jwt", { session: false }), ventasController.getVentaById);
router.put("/:id",passport.authenticate("jwt", { session: false }), ventasController.updateVenta);
router.delete("/:id",passport.authenticate("jwt", { session: false }), ventasController.deleteVenta);
router.get("/cliente/:clienteId",passport.authenticate("jwt", { session: false }), ventasController.getVentasByCliente);
router.get("/estado/:estado",passport.authenticate("jwt", { session: false }), ventasController.getVentasByEstado);