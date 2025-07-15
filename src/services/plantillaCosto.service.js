import { PlantillaCostoDAOMongo } from '../dao/PlantillaCostoDAOMongo.js';
import { MateriaPrimaModel } from '../dao/models/MateriaPrimaSchema.js';

// Servicio para manejar la lógica de las plantillas de costos
class PlantillaCostoService {
  constructor(dao) {
    this.dao = dao;
  }

  // Calcula el costo total y el precio final de la plantilla
  async calcularCostos(items, porcentajesPorCategoria) {
  let costoTotal = 0;
  let precioFinal = 0;
  const subtotales = {};

  // Calcular subtotales por categoría
  for (const item of items) {
    const materia = await MateriaPrimaModel.findById(item.materiaPrima);
    if (materia) {
      const subtotal = materia.precio * item.cantidad;
      costoTotal += subtotal;
      if (!subtotales[item.categoria]) subtotales[item.categoria] = 0;
      subtotales[item.categoria] += subtotal;
    }
  }
    // Aplicar porcentaje de ganancia por categoría
  for (const categoria in subtotales) {
    const porcentaje = porcentajesPorCategoria[categoria] || 0;
    precioFinal += subtotales[categoria] * (1 + porcentaje / 100);
  }

  return { costoTotal, precioFinal, subtotales };
}

  async createPlantilla(data) {
    const { items, porcentajesPorCategoria, nombre } = data;
    const { costoTotal, precioFinal, subtotales } = await this.calcularCostos(items, porcentajesPorCategoria);
    const ganancia = precioFinal - costoTotal; // Calcular ganancia
    return await this.dao.create({
      nombre,
      items,
      porcentajesPorCategoria,
      costoTotal,
      subtotales,
      precioFinal,
      ganancia
    });
  }

  // Obtener todas las plantillas
  async getAllPlantillas() {
    return await this.dao.getAll();
  }

  // Obtener una plantilla por ID
  async getPlantillaById(id) {
    return await this.dao.getById(id);
  }

  // Actualizar una plantilla existente
  async updatePlantilla(id, data) {
    const { items, porcentajeGanancia, nombre } = data;
    const { costoTotal, precioFinal } = await this.calcularCostos(items, porcentajeGanancia);
    return await this.dao.update(id, {
      nombre,
      items,
      porcentajeGanancia,
      costoTotal,
      precioFinal
    });
  }

  // Eliminar una plantilla por ID
  async deletePlantilla(id) {
    return await this.dao.delete(id);
  }
}

// Exporta una instancia del servicio
export const plantillaCostoService = new PlantillaCostoService(PlantillaCostoDAOMongo);