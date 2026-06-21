import { Router } from 'express';
import multer from 'multer';
import { plantillaCostoController } from '../controllers/index.js';
import {validacionCreatePlantillaCosto,validacionUpdatePlantillaCosto,validacionIdPlantillaCosto,validacionDuplicarPlantillaCosto} from "../middlewares/validations/index.js";
import passport from "passport";
export const router = Router();

const TIPOS_PERMITIDOS = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const uploadArchivos = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB por archivo
  fileFilter: (_req, file, cb) => {
    if (TIPOS_PERMITIDOS.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Tipo de archivo no permitido (solo PDF e imágenes)'));
  },
});


router.post('/',passport.authenticate("jwt", { session: false }),validacionCreatePlantillaCosto, plantillaCostoController.create);

router.post('/preview', passport.authenticate("jwt", { session: false }), plantillaCostoController.preview);
router.post('/recalculate/all',passport.authenticate("jwt", { session: false }), plantillaCostoController.recalculateAll);
router.put('/renombrar-tipo', passport.authenticate("jwt", { session: false }), plantillaCostoController.renameTipoProyecto);
router.post('/sync-pintura-price', passport.authenticate("jwt", { session: false }), plantillaCostoController.syncPinturaPrice);
router.get('/debug/:id', passport.authenticate("jwt", { session: false }), plantillaCostoController.debugPricing);
router.get('/tipos', passport.authenticate("jwt", { session: false }), plantillaCostoController.getTiposProyecto);

router.get('/', passport.authenticate("jwt", { session: false }),plantillaCostoController.getAll);

router.get('/:id',passport.authenticate("jwt", { session: false }),validacionIdPlantillaCosto, plantillaCostoController.getById);

router.post('/:id/duplicate',passport.authenticate("jwt", { session: false }),validacionDuplicarPlantillaCosto, plantillaCostoController.duplicate);

router.post('/:id/archivos',passport.authenticate("jwt", { session: false }),validacionIdPlantillaCosto, uploadArchivos.array('archivos'), plantillaCostoController.addArchivos);

router.delete('/:id/archivos',passport.authenticate("jwt", { session: false }),validacionIdPlantillaCosto, plantillaCostoController.removeArchivo);

router.put('/:id',passport.authenticate("jwt", { session: false }),validacionUpdatePlantillaCosto, plantillaCostoController.update);

router.delete('/:id',passport.authenticate("jwt", { session: false }),validacionIdPlantillaCosto, plantillaCostoController.delete);

