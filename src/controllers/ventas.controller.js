import { ventasService } from "../services/index.js";
import logger from "../config/logger.js";

export const ventasController = {
  async createVenta(req, res, next) {
    try {
      const venta = await ventasService.createVenta(req.body);
      if(!venta) {
        logger.warn('No se pudo crear la venta', { body: req.body });
        const error = new Error("No se pudo crear la venta");
        error.status = 400;
        return next(error);
      }
      logger.info('Venta creada exitosamente', { id: venta._id });
      res.status(201).json(venta);
    } catch (error) {
      logger.error('Error al crear la venta', { error });
      next(error);
    }
  },

  async getAllVentas(req, res,next) {
    try {
      const page = Math.max(1, parseInt(req.query.page || '1', 10));
      const limit = Math.max(1, parseInt(req.query.limit || '10', 10));
      // Si trae parámetros de paginación, devolver paginado
      if (req.query.page || req.query.limit) {
        logger.info(`Obteniendo ventas paginadas - Página: ${page}, Límite: ${limit}`);
        const result = await ventasService.getAllVentasPaginated(page, limit);
        return res.json(result);
      }
      
      // Compat: respuesta completa sin paginar
      const ventas = await ventasService.getAllVentas();
      logger.info(`Obteniendo todas las ventas`);
      res.json(ventas);
    } catch (error) {
      logger.error('Error al obtener las ventas', { error });
      next(error);
    }
  },

  async getVentaById(req, res, next) {
    try {
      const venta = await ventasService.getVentaById(req.params.id);
      if (!venta) {
        logger.warn(`Venta no encontrada, ID: ${req.params.id}`);
        const error = new Error("Venta no encontrada");
        error.status = 404;
        return next(error);
      }
      logger.info(`Venta encontrada, ID: ${req.params.id}`);
      res.json(venta);
    } catch (error) {
      logger.error('Error al obtener la venta', { error });
      next(error);
    }
  },

  async updateVenta(req, res, next) {
    try {
      const venta = await ventasService.updateVenta(req.params.id, req.body);
      if (!venta) {
        logger.warn(`Venta no encontrada para actualizar, ID: ${req.params.id}`);
        const error = new Error("Venta no encontrada");
        error.status = 404;
        return next(error);
      }
      logger.info(`Venta actualizada, ID: ${req.params.id}`);
      res.json(venta); 
    } catch (error) {
      logger.error('Error al actualizar la venta', { error });
      next(error);
    }
  },

  async deleteVenta(req, res, next) {
    try {
      const venta = await ventasService.deleteVenta(req.params.id);
      if (!venta) {
        logger.warn(`Venta no encontrada para eliminar, ID: ${req.params.id}`);
        const error = new Error("Venta no encontrada");
        error.status = 404;
        return next(error);
      }
      logger.info(`Venta eliminada, ID: ${req.params.id}`);
      res.json({
        message: `Venta eliminada, ID: ${req.params.id}`,
      });
    } catch (error) {
      logger.error('Error al eliminar la venta', { error });
      next(error);
    }
  },

  async getVentasByCliente(req, res, next) {
    try {
      const ventas = await ventasService.getVentasByCliente(req.params.cliente);
      if (!ventas || ventas.length === 0) {
        logger.warn(`No se encontraron ventas para el cliente, Cliente: ${req.params.cliente}`);
        const error = new Error("No se encontraron ventas para este cliente");
        error.status = 404;
        return next(error);
      }
      logger.info(`Ventas encontradas para el cliente, Cliente: ${req.params.cliente}`);
      res.json(ventas);
    } catch (error) {
      logger.error('Error al obtener las ventas por cliente', { error });
      next(error);
    }
  },
  async getVentasByEstado(req, res, next) {
    try {
      const ventas = await ventasService.getVentasByEstado(req.params.estado);
      if (!ventas || ventas.length === 0) {
        logger.warn(`No se encontraron ventas para el estado, Estado: ${req.params.estado}`);
        const error = new Error("No se encontraron ventas con este estado");
        error.status = 404;
        return next(error);
      }
      logger.info(`Ventas encontradas para el estado, Estado: ${req.params.estado}`);
      res.json(ventas);
    } catch (error) {
      logger.error('Error al obtener las ventas por estado', { error });
      next(error);
    }
  },
};
