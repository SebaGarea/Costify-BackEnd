import { PlantillaCostoDAOMongo } from '../dao/index.js';
import { computePlanillaPricing } from '../utils/pricing.js';
import { normalizeExtrasPayload, calculateExtrasTotal } from '../utils/planillaExtras.js';

class PlantillaCostoService {
  constructor(dao) {
    this.dao = dao;
  }

  toNumber(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  sumValues(values = {}) {
    return Object.values(values).reduce((acc, value) => acc + this.toNumber(value), 0);
  }

  toPlainObject(value) {
    if (!value) return {};
    if (value instanceof Map) return Object.fromEntries(value);
    if (typeof value.toObject === 'function') return value.toObject();
    if (typeof value === 'object') return { ...value };
    return {};
  }

  determinarCategoria(subtotales) {
    if (!subtotales || Object.keys(subtotales).length === 0) return 'Otro';

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

    if (totalCategorias > 2) return 'Mixta';

    const totalSubtotales = Object.values(subtotales).reduce((sum, val) => sum + (val || 0), 0);
    if (totalSubtotales > 0 && (mayorSubtotal / totalSubtotales) < 0.7 && totalCategorias > 1) {
      return 'Mixta';
    }

    const mapeoCategoria = {
      herreria: 'Herrería',
      carpinteria: 'Carpintería',
      pintura: 'Pintura',
      otros: 'Otros',
    };

    return mapeoCategoria[categoriaPrincipal?.toLowerCase?.() || ''] || 'Mixta';
  }

  async recalcularTotales(planillaData, extrasNormalizados) {
    const pricing = await computePlanillaPricing(planillaData);
    const subtotales = pricing.subtotalesPorCategoria || {};
    const costoMateriales = pricing.costoMateriales ?? this.sumValues(subtotales);
    const extrasTotal = pricing.extrasTotal ?? calculateExtrasTotal(extrasNormalizados);
    const costoTotal = pricing.costoTotal ?? (costoMateriales + extrasTotal);
    const precioFinal = pricing.precioFinal ?? ((pricing.unitPrice || costoMateriales) + extrasTotal);
    const ganancia = pricing.ganancia ?? (precioFinal - costoTotal);

    return { costoTotal, precioFinal, subtotales, extrasTotal, ganancia };
  }

  async createPlantilla(data) {
    const { items, porcentajesPorCategoria, nombre, consumibles, categoria, tipoProyecto, tags, extras } = data;
    const extrasNormalizados = normalizeExtrasPayload(extras);
    const itemsData = Array.isArray(items) ? items : [];
    const porcentajesData = porcentajesPorCategoria || {};
    const consumiblesData = consumibles || {};

    const basePlanilla = {
      items: itemsData,
      porcentajesPorCategoria: porcentajesData,
      consumibles: consumiblesData,
      extras: extrasNormalizados,
    };

    const { costoTotal, precioFinal, subtotales, extrasTotal, ganancia } =
      await this.recalcularTotales(basePlanilla, extrasNormalizados);
    const categoriaFinal = categoria || this.determinarCategoria(subtotales);

    return await this.dao.create({
      nombre,
      items: itemsData,
      categoria: categoriaFinal,
      tipoProyecto: tipoProyecto || 'Otro',
      tags: tags || [],
      porcentajesPorCategoria: porcentajesData,
      consumibles: consumiblesData,
      extras: extrasNormalizados,
      extrasTotal,
      costoTotal,
      subtotales,
      precioFinal,
      ganancia,
    });
  }

  async getAllPlantillas(filtros = {}) {
    return await this.dao.getAll(filtros);
  }

  async getPlantillaById(id) {
    return await this.dao.getById(id);
  }

  async updatePlantilla(id, data) {
    const plantillaExistente = this.dao.getById ? await this.dao.getById(id) : null;

    if (!plantillaExistente) {
      const extrasNormalizados = normalizeExtrasPayload(data.extras);
      const basePlanilla = {
        items: Array.isArray(data.items) ? data.items : [],
        porcentajesPorCategoria: data.porcentajesPorCategoria || {},
        consumibles: data.consumibles || {},
        extras: extrasNormalizados,
      };

      const { costoTotal, precioFinal, subtotales, extrasTotal, ganancia } =
        await this.recalcularTotales(basePlanilla, extrasNormalizados);

      const categoriaFinal = data.categoria || this.determinarCategoria(subtotales);
      const tipoProyectoFinal = data.tipoProyecto || 'Otro';
      const tagsFinal = Array.isArray(data.tags) ? data.tags : [];

      return await this.dao.update(id, {
        nombre: data.nombre,
        items: basePlanilla.items,
        porcentajesPorCategoria: basePlanilla.porcentajesPorCategoria,
        consumibles: basePlanilla.consumibles,
        extras: extrasNormalizados,
        extrasTotal,
        costoTotal,
        subtotales,
        precioFinal,
        ganancia,
        categoria: categoriaFinal,
        tipoProyecto: tipoProyectoFinal,
        tags: tagsFinal,
      });
    }

    const itemsActualizados = Array.isArray(data.items)
      ? data.items
      : plantillaExistente.items || [];
    const porcentajesActualizados =
      data.porcentajesPorCategoria || plantillaExistente.porcentajesPorCategoria || {};
    const consumiblesActualizados = data.consumibles || plantillaExistente.consumibles || {};
    const extrasNormalizados = normalizeExtrasPayload(data.extras || plantillaExistente.extras);

    const basePlanilla = {
      items: itemsActualizados,
      porcentajesPorCategoria: porcentajesActualizados,
      consumibles: consumiblesActualizados,
      extras: extrasNormalizados,
    };

    const { costoTotal, precioFinal, subtotales, extrasTotal, ganancia } =
      await this.recalcularTotales(basePlanilla, extrasNormalizados);

    const nombreFinal = data.nombre ?? plantillaExistente.nombre;
    const categoriaFinal = data.categoria || this.determinarCategoria(subtotales);
    const tipoProyectoFinal = data.tipoProyecto ?? plantillaExistente.tipoProyecto ?? 'Otro';
    const tagsFinal = Array.isArray(data.tags) ? data.tags : (plantillaExistente.tags || []);

    return await this.dao.update(id, {
      nombre: nombreFinal,
      items: itemsActualizados,
      porcentajesPorCategoria: porcentajesActualizados,
      consumibles: consumiblesActualizados,
      extras: extrasNormalizados,
      extrasTotal,
      costoTotal,
      subtotales,
      precioFinal,
      ganancia,
      categoria: categoriaFinal,
      tipoProyecto: tipoProyectoFinal,
      tags: tagsFinal,
    });
  }

  async deletePlantilla(id) {
    return await this.dao.delete(id);
  }

  async recalculateAllPlantillas() {
    const plantillas = await this.dao.getAll();
    const stats = {
      total: Array.isArray(plantillas) ? plantillas.length : 0,
      updated: 0,
      errors: [],
    };

    if (!Array.isArray(plantillas) || plantillas.length === 0) {
      return stats;
    }

    for (const planilla of plantillas) {
      const planillaId = planilla?._id?.toString?.() || String(planilla?._id ?? '');
      try {
        const extrasNormalizados = normalizeExtrasPayload(planilla.extras);
        const itemsPlanilla = Array.isArray(planilla.items) ? planilla.items : [];
        if (itemsPlanilla.length === 0) {
          stats.errors.push({ id: planillaId, message: 'No items; se omite recálculo' });
          continue;
        }
        const basePlanilla = {
          items: itemsPlanilla,
          porcentajesPorCategoria: this.toPlainObject(planilla.porcentajesPorCategoria),
          consumibles: this.toPlainObject(planilla.consumibles),
          extras: extrasNormalizados,
        };

        const { costoTotal, precioFinal, subtotales, extrasTotal, ganancia } =
          await this.recalcularTotales(basePlanilla, extrasNormalizados);

        const categoriaFinal = planilla.categoria || this.determinarCategoria(subtotales);

        await this.dao.update(planilla._id, {
          items: basePlanilla.items,
          porcentajesPorCategoria: basePlanilla.porcentajesPorCategoria,
          consumibles: basePlanilla.consumibles,
          extras: extrasNormalizados,
          extrasTotal,
          costoTotal,
          subtotales,
          precioFinal,
          ganancia,
          categoria: categoriaFinal,
        });

        stats.updated += 1;
      } catch (error) {
        stats.errors.push({ id: planillaId, message: error?.message || 'unknown error' });
      }
    }

    return stats;
  }
}

export const plantillaCostoService = new PlantillaCostoService(PlantillaCostoDAOMongo);
export { PlantillaCostoService };
