import { Router } from "express";
import passport from "passport";
import { tareasController } from "../controllers/index.js";
import {
  validacionCreateTarea,
  validacionUpdateTarea,
  validacionIdTarea,
  validacionQueryTareas,
} from "../middlewares/validations/tareas.validation.js";

export const router = Router();

router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  validacionCreateTarea,
  tareasController.createTarea
);

router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  validacionQueryTareas,
  tareasController.getAllTareas
);

router.get(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  validacionIdTarea,
  tareasController.getTareaById
);

router.put(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  validacionUpdateTarea,
  tareasController.updateTarea
);

router.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  validacionIdTarea,
  tareasController.deleteTarea
);
