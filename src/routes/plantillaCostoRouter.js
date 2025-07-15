import { Router } from 'express';
import { plantillaCostoController } from '../controllers/plantillaCosto.controller.js';

export const router = Router();

// Crear una nueva plantilla
router.post('/', plantillaCostoController.create);
// Obtener todas las plantillas
router.get('/', plantillaCostoController.getAll);
// Obtener una plantilla por ID
router.get('/:id', plantillaCostoController.getById);
// Actualizar una plantilla por ID
router.put('/:id', plantillaCostoController.update);
// Eliminar una plantilla por ID
router.delete('/:id', plantillaCostoController.delete);

