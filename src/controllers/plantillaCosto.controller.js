import { plantillaCostoService } from '../services/plantillaCosto.service.js';

// Controlador para manejar las peticiones HTTP de plantillas de costos
export const plantillaCostoController = {
  // Crear una nueva plantilla
  async create(req, res) {
    try {
      const plantilla = await plantillaCostoService.createPlantilla(req.body);
      res.status(201).json(plantilla);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Obtener todas las plantillas
  async getAll(req, res) {
    try {
      const plantillas = await plantillaCostoService.getAllPlantillas();
      res.json(plantillas);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener una plantilla por ID
  async getById(req, res) {
    try {
      const plantilla = await plantillaCostoService.getPlantillaById(req.params.id);
      if (!plantilla) return res.status(404).json({ error: 'Plantilla no encontrada' });
      res.json(plantilla);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Actualizar una plantilla por ID
  async update(req, res) {
    try {
      const plantilla = await plantillaCostoService.updatePlantilla(req.params.id, req.body);
      if (!plantilla) return res.status(404).json({ error: 'Plantilla no encontrada' });
      res.json(plantilla);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Eliminar una plantilla por ID
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