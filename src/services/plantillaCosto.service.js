import { PlantillaCostoDAOMongo } from '../dao/index.js';
import { MateriaPrimaModel } from '../dao/models/MateriaPrimaSchema.js';

// Servicio para manejar la lógica de las plantillas de costos
class PlantillaCostoService {
  constructor(dao) {
    this.dao = dao;
  }

  // Determinar categoría principal basándose en los items
  determinarCategoria(subtotales) {
    if (!subtotales || Object.keys(subtotales).length === 0) return 'Otro';
    
    // Encontrar la categoría con mayor subtotal
    let categoriaPrincipal = '';
    let mayorSubtotal = 0;
    let totalCategorias = 0;
    
    for (const categoria in subtotales) {
      const subtotal = subtotales[categoria] || 0;
      if (subtotal > mayorSubtotal) {
        mayorSubtotal = subtotal;
        categoriaPrincipal = categoria;
      }
      if (subtotal > 0) totalCategorias++;
    }
    
    // Si hay más de 2 categorías significativas, es "Mixta"
    if (totalCategorias > 2) return 'Mixta';
    
    // Si el mayor subtotal no es dominante (menos del 70%), es "Mixta"
    const totalSubtotales = Object.values(subtotales).reduce((sum, val) => sum + (val || 0), 0);
    if (totalSubtotales > 0 && (mayorSubtotal / totalSubtotales) < 0.7 && totalCategorias > 1) {
      return 'Mixta';
    }
    
    // Mapear categorías internas a categorías del schema
    const mapeoCategoria = {
      'herreria': 'Herrería',
      'carpinteria': 'Carpintería', 
      'pintura': 'Pintura'
    };
    
    return mapeoCategoria[categoriaPrincipal.toLowerCase()] || 'Mixta';
  }

  // Calcula el costo total y el precio final de la plantilla
  async calcularCostos(items, porcentajesPorCategoria, consumibles = {}) {
    let costoTotal = 0;
    let precioFinal = 0;
    const subtotales = {};

    // Calcular subtotales por categoría (materiales)
    for (const item of items) {
      if (!item) continue;

      const cantidad = parseFloat(item.cantidad) || 0;
      if (cantidad <= 0) continue;

      let precioBase = 0;
      if (item.materiaPrima) {
        const materiaPrima = await MateriaPrimaModel.findById(item.materiaPrima);
        precioBase = materiaPrima ? materiaPrima.precio : item.valor;
      } else {
        precioBase = item.valor;
      }

      if (precioBase === undefined || precioBase === null) continue;
      const precioUnitario = parseFloat(precioBase) || 0;

      const subtotal = precioUnitario * cantidad;
      costoTotal += subtotal;
      if (!subtotales[item.categoria]) subtotales[item.categoria] = 0;
      subtotales[item.categoria] += subtotal;
    }

    // Agregar consumibles a subtotales por categoría
    for (const categoria in consumibles) {
      const valorConsumible = parseFloat(consumibles[categoria]) || 0;
      if (valorConsumible > 0) {
        if (!subtotales[categoria]) subtotales[categoria] = 0;
        subtotales[categoria] += valorConsumible;
        costoTotal += valorConsumible;
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
    const { items, porcentajesPorCategoria, nombre, consumibles, categoria, tipoProyecto, tags } = data;
    const { costoTotal, precioFinal, subtotales } = await this.calcularCostos(items, porcentajesPorCategoria, consumibles);
    const ganancia = precioFinal - costoTotal; // Calcular ganancia
    
    // Determinar categoría automáticamente si no se proporciona
    const categoriaFinal = categoria || this.determinarCategoria(subtotales);
    
    return await this.dao.create({
      nombre,
      items,
      categoria: categoriaFinal,
      tipoProyecto: tipoProyecto || 'Otro',
      tags: tags || [],
      porcentajesPorCategoria,
      consumibles,
      costoTotal,
      subtotales,
      precioFinal,
      ganancia
    });
  }

  // Obtener todas las plantillas
  async getAllPlantillas(filtros = {}) {
    return await this.dao.getAll(filtros);
  }

  // Obtener una plantilla por ID
  async getPlantillaById(id) {
    return await this.dao.getById(id);
  }

  // Actualizar una plantilla existente
  async updatePlantilla(id, data) {
    const { items, porcentajesPorCategoria, nombre, consumibles, categoria, tipoProyecto, tags } = data;
    const { costoTotal, precioFinal, subtotales } = await this.calcularCostos(items, porcentajesPorCategoria, consumibles);
    const ganancia = precioFinal - costoTotal; // Calcular ganancia
    
    // Determinar categoría automática si no se proporciona
    const categoriaFinal = categoria || this.determinarCategoria(subtotales);
    
    return await this.dao.update(id, {
      nombre,
      items,
      porcentajesPorCategoria,
      consumibles,
      costoTotal,
      subtotales,
      precioFinal,
      ganancia,
      categoria: categoriaFinal,
      tipoProyecto: tipoProyecto || 'Otro',
      tags: tags || []
    });
  }

  // Eliminar una plantilla por ID
  async deletePlantilla(id) {
    return await this.dao.delete(id);
  }
}

// Exporta una instancia del servicio
export const plantillaCostoService = new PlantillaCostoService(PlantillaCostoDAOMongo);
export { PlantillaCostoService };