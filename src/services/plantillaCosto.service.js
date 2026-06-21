import { PlantillaCostoDAOMongo, MateriaPrimaDAOMongo } from '../dao/index.js';
import { MateriaPrimaModel } from '../dao/models/index.js';
import { computePlanillaPricing } from '../utils/pricing.js';
import { normalizeExtrasPayload, calculateExtrasTotal } from '../utils/planillaExtras.js';
import { uploadPlantillaArchivos, deleteCloudinaryAssets } from './cloudinary.service.js';

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

  normalizeItemMateriaPrima(item) {
    const materiaPrima = item?.materiaPrima;
    if (!materiaPrima) return undefined;
    if (typeof materiaPrima === 'string') return materiaPrima;
    if (typeof materiaPrima === 'object' && materiaPrima._id) return materiaPrima._id;
    return materiaPrima;
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
    const { items, porcentajesPorCategoria, nombre, consumibles, categoria, tipoProyecto, tags, extras, precioPinturaM2, precioPinturaPersonalizado, comentarios } = data;
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
      precioPinturaM2: Number(precioPinturaM2) || 15000,
      precioPinturaPersonalizado: Boolean(precioPinturaPersonalizado),
      comentarios: typeof comentarios === 'string' ? comentarios : '',
    });
  }

  // Recalcula en vivo precioFinal/costoTotal/ganancia usando los precios actuales de las MPs.
  // Así la card del listado siempre muestra lo mismo que el detalle de la plantilla.
  async _attachLivePricing(planilla) {
    if (!planilla) return planilla;
    const items = Array.isArray(planilla.items) ? planilla.items : [];
    if (items.length === 0) return planilla;
    try {
      const pricing = await computePlanillaPricing(planilla);
      const precioFinal = Number(pricing.precioFinal ?? 0);
      if (Number.isFinite(precioFinal) && precioFinal > 0) {
        planilla.precioFinal = precioFinal;
      }
      const costoTotal = Number(pricing.costoTotal ?? 0);
      if (Number.isFinite(costoTotal) && costoTotal > 0) {
        planilla.costoTotal = costoTotal;
      }
      const ganancia = Number(pricing.ganancia ?? 0);
      if (Number.isFinite(ganancia)) {
        planilla.ganancia = ganancia;
      }
    } catch {
      /* si falla, devolvemos lo persistido */
    }
    return planilla;
  }

  async getAllPlantillas(filtros = {}) {
    const plantillas = await this.dao.getAll(filtros);
    if (!Array.isArray(plantillas)) return plantillas;
    return Promise.all(plantillas.map((p) => this._attachLivePricing(p)));
  }

  async getPlantillaById(id) {
    const planilla = await this.dao.getById(id);
    return this._attachLivePricing(planilla);
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
        precioPinturaM2: Number(data.precioPinturaM2) || 15000,
        precioPinturaPersonalizado: Boolean(data.precioPinturaPersonalizado),
        comentarios: typeof data.comentarios === 'string' ? data.comentarios : '',
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
      precioPinturaM2: Number(data.precioPinturaM2) || 15000,
      precioPinturaPersonalizado: Boolean(data.precioPinturaPersonalizado),
      comentarios:
        typeof data.comentarios === 'string'
          ? data.comentarios
          : (plantillaExistente.comentarios ?? ''),
    });
  }

  async addArchivos(id, files = []) {
    const plantilla = await this.dao.getById(id);
    if (!plantilla) return null;
    const archivosSubidos = await uploadPlantillaArchivos(files);
    if (!archivosSubidos.length) {
      return plantilla;
    }
    return await this.dao.pushArchivos(id, archivosSubidos);
  }

  async removeArchivo(id, publicId) {
    const archivo = await this.dao.getArchivo(id, publicId);
    if (!archivo) return null;
    await deleteCloudinaryAssets([publicId]);
    return await this.dao.pullArchivo(id, publicId);
  }

  async deletePlantilla(id) {
    const plantilla = await this.dao.getById(id);
    const publicIds = (plantilla?.archivos || [])
      .map((a) => a.publicId)
      .filter(Boolean);
    if (publicIds.length) {
      await deleteCloudinaryAssets(publicIds);
    }
    return await this.dao.delete(id);
  }

  async duplicatePlantilla(id, { nombre } = {}) {
    const origen = await this.getPlantillaById(id);
    if (!origen) return null;

    const nombreNuevo = (typeof nombre === 'string' ? nombre.trim() : '') || `${origen.nombre} (copia)`;

    const itemsOrigen = Array.isArray(origen.items) ? origen.items : [];
    const itemsDuplicados = itemsOrigen.map((item) => ({
      materiaPrima: this.normalizeItemMateriaPrima(item),
      valor: item?.valor,
      cantidad: item?.cantidad,
      categoria: item?.categoria,
      gananciaIndividual: item?.gananciaIndividual,
      esPersonalizado: item?.esPersonalizado,
      descripcionPersonalizada: item?.descripcionPersonalizada,
      categoriaMP: item?.categoriaMP,
      tipoMP: item?.tipoMP,
      medidaMP: item?.medidaMP,
      espesorMP: item?.espesorMP,
      nombreMadera: item?.nombreMadera,
      pinturaAlHorno: item?.pinturaAlHorno ?? false,
      perfilPinturaId: item?.perfilPinturaId ?? null,
      perfilPinturaPerimetro: item?.perfilPinturaPerimetro ?? 0,
      costoPintura: item?.costoPintura ?? 0,
    }));

    return await this.createPlantilla({
      nombre: nombreNuevo,
      items: itemsDuplicados,
      categoria: origen.categoria,
      tipoProyecto: origen.tipoProyecto,
      tags: Array.isArray(origen.tags) ? origen.tags : [],
      porcentajesPorCategoria: this.toPlainObject(origen.porcentajesPorCategoria),
      consumibles: this.toPlainObject(origen.consumibles),
      extras: origen.extras,
      precioPinturaM2: origen.precioPinturaM2 ?? 15000,
      precioPinturaPersonalizado: origen.precioPinturaPersonalizado ?? false,
    });
  }

  async syncPinturaPrice() {
    const mp = await MateriaPrimaDAOMongo.findOneByFields({
      categoria: { $regex: /^proteccion$/i },
      type: { $regex: /pintura al horno/i },
    });

    if (!mp?.precio) {
      return { synced: 0, message: 'No se encontró la materia prima "Pintura al Horno" en la base de datos' };
    }

    const nuevoPrecio = Number(mp.precio);
    const plantillas = await this.dao.getAll();
    if (!Array.isArray(plantillas) || plantillas.length === 0) {
      return { synced: 0, precio: nuevoPrecio };
    }

    let synced = 0;
    for (const plantilla of plantillas) {
      if (plantilla.precioPinturaPersonalizado) continue;
      await this.dao.update(plantilla._id, { precioPinturaM2: nuevoPrecio });
      synced++;
    }

    return { synced, precio: nuevoPrecio };
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

    // Pre-cargar todos los precios live de materias primas usadas en todas las plantillas
    const toStrId = (v) => {
      if (!v) return null;
      if (typeof v === 'string') return v;
      if (v._id) return v._id.toString();
      return v.toString();
    };

    const allMpIds = new Set();
    for (const planilla of plantillas) {
      for (const item of (planilla.items || [])) {
        if (!item.esPersonalizado && item.isPriceAuto !== false && item.materiaPrima) {
          const id = toStrId(item.materiaPrima);
          if (id) allMpIds.add(id);
        }
      }
    }

    let preciosLive = new Map();
    if (allMpIds.size > 0) {
      const mps = await MateriaPrimaModel.find({ _id: { $in: [...allMpIds] } }).lean();
      preciosLive = new Map(mps.map(mp => [mp._id.toString(), Number(mp.precio)]));
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

        // Actualizar el campo valor de cada ítem auto con el precio live de la MP
        const itemsActualizados = itemsPlanilla.map(item => {
          if (item.esPersonalizado || item.isPriceAuto === false || !item.materiaPrima) {
            return item;
          }
          const mpId = toStrId(item.materiaPrima);
          const precioActual = mpId ? preciosLive.get(mpId) : null;
          if (precioActual == null) return item;
          return { ...item, valor: precioActual };
        });

        const basePlanilla = {
          items: itemsActualizados,
          porcentajesPorCategoria: this.toPlainObject(planilla.porcentajesPorCategoria),
          consumibles: this.toPlainObject(planilla.consumibles),
          extras: extrasNormalizados,
        };

        const { costoTotal, precioFinal, subtotales, extrasTotal, ganancia } =
          await this.recalcularTotales(basePlanilla, extrasNormalizados);

        const categoriaFinal = planilla.categoria || this.determinarCategoria(subtotales);

        await this.dao.update(planilla._id, {
          items: itemsActualizados,
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

  async renameTipoProyecto(tipoActual, tipoNuevo) {
    const result = await this.dao.updateManyTipoProyecto(tipoActual, tipoNuevo);
    return result.modifiedCount;
  }

  async getTiposProyecto() {
    const tipos = await this.dao.getTiposProyecto();
    return tipos.filter((t) => t && t.trim() !== '').sort();
  }
}

export const plantillaCostoService = new PlantillaCostoService(PlantillaCostoDAOMongo);
export { PlantillaCostoService };
