import { plantillaCostoService } from '../services/plantillaCosto.service.js';


export const plantillaCostoController = {
  
  async create(req, res, next) {
    try {
      const plantilla = await plantillaCostoService.createPlantilla(req.body);
      if (!plantilla) {
        const error = new Error("No se pudo crear la plantilla de costo");
        error.status = 400;
        return next(error);
      }
      res.status(201).json(plantilla);
    } catch (error) {
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
        const error = new Error("No se encontraron plantillas de costo");
        error.status = 404;
        return next(error);
      }
      res.json(plantillas);
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res) {
    try {
      const plantilla = await plantillaCostoService.getPlantillaById(req.params.id);
      if (!plantilla) {
        const error = new Error("Plantilla no encontrada");
        error.status = 404;
        return next(error);
      }
      res.json(plantilla);
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const plantilla = await plantillaCostoService.updatePlantilla(req.params.id, req.body);
      if (!plantilla) {
        const error = new Error("Plantilla no encontrada");
        error.status = 404;
        return next(error);
      }
      res.json(plantilla);
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const plantilla = await plantillaCostoService.deletePlantilla(req.params.id);
      if (!plantilla) {
        const error = new Error("Plantilla no encontrada");
        error.status = 404;
        return next(error);
      }
      res.json({ mensaje: 'Plantilla eliminada', plantilla });
    } catch (error) {
      next(error);
    }
  }
};