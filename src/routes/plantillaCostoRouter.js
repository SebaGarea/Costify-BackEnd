import { Router } from 'express';
import { plantillaCostoController } from '../controllers/index.js';
import {validacionCreatePlantillaCosto,validacionUpdatePlantillaCosto,validacionIdPlantillaCosto,validacionDuplicarPlantillaCosto} from "../middlewares/validations/index.js";
import passport from "passport";
export const router = Router();


router.post('/',passport.authenticate("jwt", { session: false }),validacionCreatePlantillaCosto, plantillaCostoController.create);

router.post('/recalculate/all',passport.authenticate("jwt", { session: false }), plantillaCostoController.recalculateAll);

router.get('/', passport.authenticate("jwt", { session: false }),plantillaCostoController.getAll);

router.get('/:id',passport.authenticate("jwt", { session: false }),validacionIdPlantillaCosto, plantillaCostoController.getById);

router.post('/:id/duplicate',passport.authenticate("jwt", { session: false }),validacionDuplicarPlantillaCosto, plantillaCostoController.duplicate);

router.put('/:id',passport.authenticate("jwt", { session: false }),validacionUpdatePlantillaCosto, plantillaCostoController.update);

router.delete('/:id',passport.authenticate("jwt", { session: false }),validacionIdPlantillaCosto, plantillaCostoController.delete);

