import { Router } from 'express';
import MateriaPrimaController from '../controllers/materiaPrima.controller.js';
import passport from "passport";


export const router=Router();

router.get('/',passport.authenticate("jwt", { session: false }), MateriaPrimaController.getAll);
router.get('/categories',passport.authenticate("jwt", { session: false }), MateriaPrimaController.getAllCategories);
router.get('/category/:category',passport.authenticate("jwt", { session: false }), MateriaPrimaController.getByCategory);
router.get('/type/:type', passport.authenticate("jwt", { session: false }),MateriaPrimaController.getByType);
router.get('/:id',passport.authenticate("jwt", { session: false }), MateriaPrimaController.getById); 
router.post('/', passport.authenticate("jwt", { session: false }),MateriaPrimaController.create);
router.put('/:id',passport.authenticate("jwt", { session: false }), MateriaPrimaController.update);
router.delete('/:id',passport.authenticate("jwt", { session: false }), MateriaPrimaController.delete);