import { Router } from 'express';
import { productoController } from '../controllers/producto.controller.js';
import multer from 'multer';

// Configuración de Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Carpeta donde se guardan las imágenes
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

export const router = Router();

router.post('/', upload.array('imagenes'), productoController.create);
router.get('/', productoController.getAll);
router.get('/:id', productoController.getById);
router.get('/catalogo/:catalogo', productoController.getByCatalogo);
router.put('/:id', upload.array('imagenes'), productoController.update);
router.delete('/:id', productoController.delete);
router.get('/modelo/:modelo', productoController.getByModelo); 