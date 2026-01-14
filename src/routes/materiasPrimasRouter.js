import { Router } from 'express';
import { MateriaPrimaController } from '../controllers/index.js';
import {validacionCreateMateriaPrima,validacionUpdateMateriaPrima,validacionIdMateriaPrima,validacionType} from "../middlewares/validations/index.js";

import passport from "passport";


export const router=Router();

router.get('/',passport.authenticate("jwt", { session: false }), MateriaPrimaController.getAll);
router.get('/categories',passport.authenticate("jwt", { session: false }), MateriaPrimaController.getAllCategories);
router.get('/category/:category',passport.authenticate("jwt", { session: false }), MateriaPrimaController.getByCategory);
router.get('/type/:type', passport.authenticate("jwt", { session: false }),validacionType,MateriaPrimaController.getByType);
router.get('/:id',passport.authenticate("jwt", { session: false }),validacionIdMateriaPrima, MateriaPrimaController.getById); 
router.post('/', passport.authenticate("jwt", { session: false }),validacionCreateMateriaPrima,MateriaPrimaController.create);
router.put('/:id',passport.authenticate("jwt", { session: false }),validacionUpdateMateriaPrima, MateriaPrimaController.update);
router.delete('/:id',passport.authenticate("jwt", { session: false }), validacionIdMateriaPrima,MateriaPrimaController.delete);