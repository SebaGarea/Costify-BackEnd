import { Router } from "express";
import passport from "passport";
import { ListaCompraController } from "../controllers/index.js";

export const router = Router();

router.get("/", passport.authenticate("jwt", { session: false }), ListaCompraController.getListaCompra);
router.put("/", passport.authenticate("jwt", { session: false }), ListaCompraController.saveListaCompra);
router.post(
  "/plantilla-items",
  passport.authenticate("jwt", { session: false }),
  ListaCompraController.vincularItemPlantilla
);
router.delete(
  "/plantilla-items/:plantillaId/:uid",
  passport.authenticate("jwt", { session: false }),
  ListaCompraController.desvincularItemPlantilla
);
