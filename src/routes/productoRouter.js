import { Router } from 'express';
import { productoController } from '../controllers/producto.controller.js';

export const router = Router();

router.post('/', productoController.create);
router.get('/', productoController.getAll);
router.get('/:id', productoController.getById);
router.put('/:id', productoController.update);
router.delete('/:id', productoController.delete);