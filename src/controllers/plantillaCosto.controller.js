import { plantillaCostoService } from '../services/plantillaCosto.service.js';


export const plantillaCostoController = {
  
  async create(req, res) {
    try {
      const plantilla = await plantillaCostoService.createPlantilla(req.body);
      res.status(201).json(plantilla);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
  
  async getAll(req, res) {
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
      res.json(plantillas);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req, res) {
    try {
      const plantilla = await plantillaCostoService.getPlantillaById(req.params.id);
      if (!plantilla) return res.status(404).json({ error: 'Plantilla no encontrada' });
      res.json(plantilla);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async update(req, res) {
    try {
      const plantilla = await plantillaCostoService.updatePlantilla(req.params.id, req.body);
      if (!plantilla) return res.status(404).json({ error: 'Plantilla no encontrada' });
      res.json(plantilla);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async delete(req, res) {
    try {
      const plantilla = await plantillaCostoService.deletePlantilla(req.params.id);
      if (!plantilla) return res.status(404).json({ error: 'Plantilla no encontrada' });
      res.json({ mensaje: 'Plantilla eliminada', plantilla });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};