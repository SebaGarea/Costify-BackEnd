import { Router } from "express";
import passport from "passport";
import { ConfiguracionController } from "../controllers/configuracion.controller.js";

export const router = Router();

const auth = passport.authenticate("jwt", { session: false });

router.get("/", auth, ConfiguracionController.get);
router.put("/", auth, ConfiguracionController.update);
router.post("/aplicar-precio-pintura", auth, ConfiguracionController.aplicarATodas);
