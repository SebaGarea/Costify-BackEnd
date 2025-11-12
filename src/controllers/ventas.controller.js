import { ventasService } from "../services/ventas.service.js";

export const ventasController = {
  async createVenta(req, res, next) {
    try {
      const venta = await ventasService.createVenta(req.body);
      if(!venta) {
        const error = new Error("No se pudo crear la venta");
        error.status = 400;
        return next(error);
      }
      res.status(201).json(venta);
    } catch (error) {
      next(error)
    }
  },

  async getAllVentas(req, res,next) {
    try {
      const page = Math.max(1, parseInt(req.query.page || '1', 10));
      const limit = Math.max(1, parseInt(req.query.limit || '10', 10));
      // Si trae parámetros de paginación, devolver paginado
      if (req.query.page || req.query.limit) {
        const result = await ventasService.getAllVentasPaginated(page, limit);
        return res.json(result);
      }
      // Compat: respuesta completa sin paginar
      const ventas = await ventasService.getAllVentas();
      res.json(ventas);
    } catch (error) {
      next(error);
    }
  },

  async getVentaById(req, res, next) {
    try {
      const venta = await ventasService.getVentaById(req.params.id);
      if (!venta) {
        const error = new Error("Venta no encontrada");
        error.status = 404;
        return next(error);
      }

      res.json(venta);
    } catch (error) {
      next(error);
    }
  },

  async updateVenta(req, res, next) {
    try {
      const venta = await ventasService.updateVenta(req.params.id, req.body);
      if (!venta) {
        const error = new Error("Venta no encontrada");
        error.status = 404;
        return next(error);
      }
      res.json(venta); 
    } catch (error) {
      next(error);
    }
  },

  async deleteVenta(req, res, next) {
    try {
      const venta = await ventasService.deleteVenta(req.params.id);
      if (!venta) {
        const error = new Error("Venta no encontrada");
        error.status = 404;
        return next(error);
      }
      res.json({
        message: `Venta eliminada, ID: ${req.params.id}`,
      });
    } catch (error) {
      next(error);
    }
  },

  async getVentasByCliente(req, res, next) {
    try {
      const ventas = await ventasService.getVentasByCliente(req.params.cliente);
      if (!ventas || ventas.length === 0) {
        const error = new Error("No se encontraron ventas para este cliente");
        error.status = 404;
        return next(error);
      }
      res.json(ventas);
    } catch (error) {
      next(error);
    }
  },
  async getVentasByEstado(req, res, next) {
    try {
      const ventas = await ventasService.getVentasByEstado(req.params.estado);
      if (!ventas || ventas.length === 0) {
        const error = new Error("No se encontraron ventas con este estado");
        error.status = 404;
        return next(error);
      }
      res.json(ventas);
    } catch (error) {
      next(error);
    }
  },
};
