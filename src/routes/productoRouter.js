import { Router } from 'express';
import { productoController } from '../controllers/producto.controller.js';
import multer from 'multer';
import passport from "passport";
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

router.post('/', passport.authenticate("jwt", { session: false }),upload.array('imagenes'), productoController.create);
router.get('/',passport.authenticate("jwt", { session: false }), productoController.getAll);
router.get('/:id',passport.authenticate("jwt", { session: false }), productoController.getById);
router.get('/catalogo/:catalogo',passport.authenticate("jwt", { session: false }), productoController.getByCatalogo);
router.put('/:id', upload.array('imagenes'),passport.authenticate("jwt", { session: false }), productoController.update);
router.delete('/:id',passport.authenticate("jwt", { session: false }), productoController.delete);
router.get('/modelo/:modelo',passport.authenticate("jwt", { session: false }), productoController.getByModelo); 