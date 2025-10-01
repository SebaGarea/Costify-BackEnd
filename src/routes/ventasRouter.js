import { Router } from "express";
import { ventasController } from "../controllers/ventas.controller.js";
export const router = Router();

router.post("/", ventasController.createVenta);
router.get("/", ventasController.getAllVentas);
router.get("/:id", ventasController.getVentaById);
router.put("/:id", ventasController.updateVenta);
router.delete("/:id", ventasController.deleteVenta);
router.get("/cliente/:clienteId", ventasController.getVentasByCliente);
router.get("/producto/:productoId", ventasController.getVentasByEstado);