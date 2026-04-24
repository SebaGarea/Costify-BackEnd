import { Router } from "express";
import passport from "passport";
import { PerfilPinturaController } from "../controllers/perfilPintura.controller.js";

export const router = Router();

router.get("/", passport.authenticate("jwt", { session: false }), PerfilPinturaController.getAll);
router.post("/", passport.authenticate("jwt", { session: false }), PerfilPinturaController.create);
router.put("/:id", passport.authenticate("jwt", { session: false }), PerfilPinturaController.update);
router.delete("/:id", passport.authenticate("jwt", { session: false }), PerfilPinturaController.delete);
