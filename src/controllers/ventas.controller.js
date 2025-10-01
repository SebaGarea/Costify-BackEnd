import { ventasService } from "../services/ventas.service.js";

export const ventasController = {
  async createVenta(req, res) {
    try {
      const venta = await ventasService.createVenta(req.body);
      res.status(201).json(venta);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async getAllVentas(req, res) {
    try {
      const ventas = await ventasService.getAllVentas();
      res.json(ventas);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getVentaById(req, res) {
    try {
      const venta = await ventasService.getVentaById(req.params.id);
      if (!venta) return res.status(404).json({ error: "Venta no encontrada" });
      res.json(venta);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async updateVenta(req, res) {
    try {
      const venta = await ventasService.updateVenta(req.params.id, req.body);
      if (!venta) return res.status(404).json({ error: "Venta no encontrada" });
      res.json(venta);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async deleteVenta(req, res) {
    try {
      const venta = await ventasService.deleteVenta(req.params.id);
      if (!venta) return res.status(404).json({ error: "Venta no encontrada" });
      res.json({ message: "Venta eliminada" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getVentasByCliente(req, res) {
    try {
      const ventas = await ventasService.getVentasByCliente(req.params.cliente);
      if (!ventas || ventas.length === 0)
        return res
          .status(404)
          .json({ error: "No se encontraron ventas para este cliente" });
      res.json(ventas);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  async getVentasByEstado(req, res) {
    try {
      const ventas = await ventasService.getVentasByEstado(req.params.estado);
      if (!ventas || ventas.length === 0)
        return res
          .status(404)
          .json({ error: "No se encontraron ventas con este estado" });
      res.json(ventas);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};
