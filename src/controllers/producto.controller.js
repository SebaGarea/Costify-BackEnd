import { productoService } from '../services/producto.service.js';

export const productoController = {
  async create(req, res) {
    try {
      const producto = await productoService.createProducto(req.body);
      res.status(201).json(producto);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async getAll(req, res) {
    try {
      const productos = await productoService.getAllProductos();
      res.json(productos);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req, res) {
    try {
      const producto = await productoService.getProductoById(req.params.id);
      if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
      res.json(producto);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async update(req, res) {
    try {
      const producto = await productoService.updateProducto(req.params.id, req.body);
      if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
      res.json(producto);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async delete(req, res) {
    try {
      const producto = await productoService.deleteProducto(req.params.id);
      if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
      res.json({ mensaje: 'Producto eliminado', producto });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};