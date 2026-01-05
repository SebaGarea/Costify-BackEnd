import { Router } from 'express';
import { productoController } from '../controllers/index.js';
import { validacionCreateProducto, validacionUpdateProducto, validacionIdProducto } from '../middlewares/validations/index.js';
import multer from 'multer';
import passport from "passport";

const storage = multer.memoryStorage();
const upload = multer({ storage });

export const router = Router();

router.post('/',passport.authenticate("jwt", { session: false }),validacionCreateProducto,upload.array('imagenes'), productoController.create);
router.get('/',passport.authenticate("jwt", { session: false }), productoController.getAll);
router.get('/:id',passport.authenticate("jwt", { session: false }),validacionIdProducto, productoController.getById);
router.get('/catalogo/:catalogo',passport.authenticate("jwt", { session: false }), productoController.getByCatalogo);
router.put('/:id',passport.authenticate("jwt", { session: false }),validacionUpdateProducto, upload.array('imagenes'), productoController.update);
router.delete('/:id',passport.authenticate("jwt", { session: false }),validacionIdProducto, productoController.delete);
router.get('/modelo/:modelo',passport.authenticate("jwt", { session: false }), productoController.getByModelo); 