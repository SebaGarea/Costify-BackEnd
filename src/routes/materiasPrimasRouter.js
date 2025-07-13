import { Router } from 'express';
import MateriaPrimaController from '../controllers/materiaPrima.controller.js';



export const router=Router()

router.get('/', MateriaPrimaController.getAll);
router.get('/:id', MateriaPrimaController.getById); 
router.post('/', MateriaPrimaController.create);
router.put('/:id', MateriaPrimaController.update);
router.delete('/:id', MateriaPrimaController.delete);
router.get('/category/:category', MateriaPrimaController.getByCategory);
router.get('/type/:type', MateriaPrimaController.getByType);
