import { plantillaCostoService } from '../services/index.js';
import logger from '../config/logger.js';

export const plantillaCostoController = {
  
  async create(req, res, next) {
    try {
      const plantilla = await plantillaCostoService.createPlantilla(req.body);
      if (!plantilla) {
        logger.warn('No se pudo crear la plantilla de costo', { body: req.body });
        const error = new Error("No se pudo crear la plantilla de costo");
        error.status = 400;
        return next(error);
      }
      logger.info('Plantilla de costo creada exitosamente', { id: plantilla._id });
      res.status(201).json(plantilla);
    } catch (error) {
      logger.error('Error al crear la plantilla de costo', { error });
      next(error);
    }
  },
  
  async getAll(req, res, next) {
    try {
      const { categoria, tipoProyecto, search } = req.query;
      const filtros = {};
      
      if (categoria && categoria !== 'todas') {
        filtros.categoria = categoria;
      }
      
      if (tipoProyecto && tipoProyecto !== 'todos') {
        filtros.tipoProyecto = tipoProyecto;
      }
      
      if (search) {
        filtros.$or = [
          { nombre: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ];
      }
      
      const plantillas = await plantillaCostoService.getAllPlantillas(filtros);
      if (!plantillas) {
        logger.warn('No se encontraron plantillas de costo', { filtros });
        const error = new Error("No se encontraron plantillas de costo");
        error.status = 404;
        return next(error);
      }
      logger.info('Plantillas de costo obtenidas exitosamente', { filtros });
      res.json(plantillas);
    } catch (error) {
      logger.error('Error al obtener las plantillas de costo', { error });
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const plantilla = await plantillaCostoService.getPlantillaById(req.params.id);
      if (!plantilla) {
        logger.warn(`Plantilla no encontrada, ID: ${req.params.id}`);
        const error = new Error("Plantilla no encontrada");
        error.status = 404;
        return next(error);
      }
      logger.info(`Plantilla encontrada, ID: ${req.params.id}`);
      res.json(plantilla);
    } catch (error) {
      logger.error('Error al obtener la plantilla de costo', { error });
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const plantilla = await plantillaCostoService.updatePlantilla(req.params.id, req.body);
      if (!plantilla) {
        logger.warn(`Plantilla no encontrada para actualizar, ID: ${req.params.id}`);
        const error = new Error("Plantilla no encontrada");
        error.status = 404;
        return next(error);
      }
      logger.info(`Plantilla actualizada, ID: ${req.params.id}`);
      res.json(plantilla);
    } catch (error) {
      logger.error('Error al actualizar la plantilla de costo', { error });
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const plantilla = await plantillaCostoService.deletePlantilla(req.params.id);
      if (!plantilla) {
        logger.warn(`Plantilla no encontrada para eliminar, ID: ${req.params.id}`);
        const error = new Error("Plantilla no encontrada");
        error.status = 404;
        return next(error);
      }
      logger.info(`Plantilla eliminada, ID: ${req.params.id}`);
      res.json({ mensaje: 'Plantilla eliminada', plantilla });
    } catch (error) {
      logger.error('Error al eliminar la plantilla de costo', { error });
      next(error);
    }
  },

  async recalculateAll(req, res, next) {
    try {
      const resultado = await plantillaCostoService.recalculateAllPlantillas();
      logger.info('Recalculo masivo de plantillas ejecutado', { resultado });
      res.json({ mensaje: 'Recalculo completado', ...resultado });
    } catch (error) {
      logger.error('Error al recalcular las plantillas de costo', { error });
      next(error);
    }
  },

  async duplicate(req, res, next) {
    try {
      const { id } = req.params;
      const { nombre } = req.body || {};

      const plantilla = await plantillaCostoService.duplicatePlantilla(id, { nombre });
      if (!plantilla) {
        logger.warn(`Plantilla no encontrada para duplicar, ID: ${id}`);
        const error = new Error("Plantilla no encontrada");
        error.status = 404;
        return next(error);
      }

      logger.info(`Plantilla duplicada, origen ID: ${id}, nueva ID: ${plantilla._id}`);
      res.status(201).json(plantilla);
    } catch (error) {
      logger.error('Error al duplicar la plantilla de costo', { error });
      next(error);
    }
  }
};