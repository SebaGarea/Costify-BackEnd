import { plantillaCostoService } from '../services/index.js';
import logger from '../config/logger.js';
import { computePlanillaPricing } from '../utils/pricing.js';
import { normalizeExtrasPayload } from '../utils/planillaExtras.js';

export const plantillaCostoController = {

  async preview(req, res, next) {
    try {
      const data = req.body || {};
      const extrasNormalizados = normalizeExtrasPayload(data.extras);
      const basePlanilla = {
        items: Array.isArray(data.items) ? data.items : [],
        porcentajesPorCategoria: data.porcentajesPorCategoria || {},
        consumibles: data.consumibles || {},
        extras: extrasNormalizados,
        precioPinturaM2: Number(data.precioPinturaM2) || 0,
      };
      const pricing = await computePlanillaPricing(basePlanilla);
      res.json({
        precioFinal: pricing.precioFinal ?? 0,
        costoTotal: pricing.costoTotal ?? 0,
        ganancia: pricing.ganancia ?? 0,
        costoMateriales: pricing.costoMateriales ?? 0,
        extrasTotal: pricing.extrasTotal ?? 0,
        totalPinturaHorno: pricing.totalPinturaHorno ?? 0,
        subtotalesPorCategoria: pricing.subtotalesPorCategoria ?? {},
        precioFinalesPorCategoria: pricing.precioFinalesPorCategoria ?? {},
      });
    } catch (error) {
      logger.error('Error al calcular preview de la plantilla', { error });
      next(error);
    }
  },

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

  async debugPricing(req, res, next) {
    try {
      const { id } = req.params;
      const planilla = await plantillaCostoService.getPlantillaById(id);
      if (!planilla) {
        return res.status(404).json({ error: 'Plantilla no encontrada' });
      }
      const { computePlanillaPricing } = await import('../utils/pricing.js');
      const pricing = await computePlanillaPricing(planilla);
      res.json({
        plantillaId: id,
        nombre: planilla.nombre,
        precioPinturaM2_guardado: planilla.precioPinturaM2,
        porcentajesPorCategoria: planilla.porcentajesPorCategoria,
        consumibles: planilla.consumibles,
        items_input: (planilla.items || []).map((it) => ({
          categoria: it.categoria,
          cantidad: it.cantidad,
          valor_guardado: it.valor,
          isPriceAuto: it.isPriceAuto,
          esPersonalizado: it.esPersonalizado,
          materiaPrima_id: typeof it.materiaPrima === 'object' ? it.materiaPrima?._id : it.materiaPrima,
          materiaPrima_precio_live: typeof it.materiaPrima === 'object' ? it.materiaPrima?.precio : null,
          gananciaIndividual: it.gananciaIndividual,
          pinturaAlHorno: it.pinturaAlHorno,
          perfilPinturaPerimetro: it.perfilPinturaPerimetro,
          costoPintura_guardado: it.costoPintura,
        })),
        pricing_output: {
          unitPrice: pricing.unitPrice,
          snapshots: pricing.snapshots,
          subtotalesPorCategoria: pricing.subtotalesPorCategoria,
          costoMateriales: pricing.costoMateriales,
          extrasTotal: pricing.extrasTotal,
          costoTotal: pricing.costoTotal,
          precioFinal: pricing.precioFinal,
          ganancia: pricing.ganancia,
        },
        precioFinal_persistido_en_plantilla: planilla.precioFinal,
        costoTotal_persistido_en_plantilla: planilla.costoTotal,
      });
    } catch (error) {
      logger.error('Error en debug pricing', { error });
      next(error);
    }
  },

  async syncPinturaPrice(req, res, next) {
    try {
      const resultado = await plantillaCostoService.syncPinturaPrice();
      logger.info('Sincronización de precio pintura al horno ejecutada', { resultado });
      res.json({ mensaje: 'Sincronización completada', ...resultado });
    } catch (error) {
      logger.error('Error al sincronizar precio de pintura al horno', { error });
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
  },

  async renameTipoProyecto(req, res, next) {
    try {
      const { tipoActual, tipoNuevo } = req.body;
      if (!tipoActual?.trim() || !tipoNuevo?.trim()) {
        const error = new Error("tipoActual y tipoNuevo son requeridos");
        error.status = 400;
        return next(error);
      }
      if (tipoActual.trim() === tipoNuevo.trim()) {
        return res.json({ modifiedCount: 0 });
      }
      const modifiedCount = await plantillaCostoService.renameTipoProyecto(
        tipoActual.trim(),
        tipoNuevo.trim()
      );
      logger.info(`Tipo de proyecto renombrado: "${tipoActual}" → "${tipoNuevo}" (${modifiedCount} plantillas)`);
      res.json({ modifiedCount });
    } catch (error) {
      logger.error('Error al renombrar tipo de proyecto', { error });
      next(error);
    }
  }
};