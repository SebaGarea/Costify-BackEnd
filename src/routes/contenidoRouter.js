import { Router } from "express";
import passport from "passport";
import { contenidoController } from "../controllers/index.js";
import {
  validacionCreateContenido,
  validacionUpdateContenido,
  validacionIdContenido,
  validacionQueryContenido,
} from "../middlewares/validations/contenido.validation.js";

export const router = Router();

router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  validacionCreateContenido,
  contenidoController.createContenido
);

router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  validacionQueryContenido,
  contenidoController.getAllContenidos
);

router.get(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  validacionIdContenido,
  contenidoController.getContenidoById
);

router.put(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  validacionUpdateContenido,
  contenidoController.updateContenido
);

router.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  validacionIdContenido,
  contenidoController.deleteContenido
);
