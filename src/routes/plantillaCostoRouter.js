import { Router } from 'express';
import { plantillaCostoController } from '../controllers/plantillaCosto.controller.js';
import {validacionCreatePlantillaCosto,validacionUpdatePlantillaCosto,validacionIdPlantillaCosto} from "../middlewares/validations/plantillaCosto.validation.js";
import passport from "passport";
export const router = Router();


router.post('/',passport.authenticate("jwt", { session: false }),validacionCreatePlantillaCosto, plantillaCostoController.create);

router.get('/', passport.authenticate("jwt", { session: false }),plantillaCostoController.getAll);

router.get('/:id',passport.authenticate("jwt", { session: false }),validacionIdPlantillaCosto, plantillaCostoController.getById);

router.put('/:id',passport.authenticate("jwt", { session: false }),validacionUpdatePlantillaCosto, plantillaCostoController.update);

router.delete('/:id',passport.authenticate("jwt", { session: false }),validacionIdPlantillaCosto, plantillaCostoController.delete);

