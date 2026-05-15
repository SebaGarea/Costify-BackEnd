import { Router } from "express";
import passport from "passport";
import { eventoCalendarioController } from "../controllers/index.js";
import {
  validacionCreateEvento,
  validacionUpdateEvento,
  validacionIdEvento,
  validacionQueryEventos,
} from "../middlewares/validations/eventoCalendario.validation.js";

export const router = Router();

router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  validacionCreateEvento,
  eventoCalendarioController.createEvento
);

router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  validacionQueryEventos,
  eventoCalendarioController.getAllEventos
);

router.get(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  validacionIdEvento,
  eventoCalendarioController.getEventoById
);

router.put(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  validacionUpdateEvento,
  eventoCalendarioController.updateEvento
);

router.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  validacionIdEvento,
  eventoCalendarioController.deleteEvento
);
