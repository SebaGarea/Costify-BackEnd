import { productoService } from '../services/producto.service.js';
import fs from 'fs';
import path from 'path';

export const productoController = {
  async create(req, res) {
    try {
      let imagenes = [];
      if (req.files && req.files.length > 0) {
        imagenes = req.files.map(file => `/uploads/${file.filename}`);
      }
      const producto = await productoService.createProducto({ ...req.body, imagenes });
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

  async getByCatalogo(req, res) {
    try {
      const catalogo = req.params.catalogo.toLowerCase();
      const productos = await productoService.getProductByCatalogo(catalogo);

      if (!productos) return res.status(404).json({ error: 'Productos no encontrados' });
      res.json(productos);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getByModelo(req, res) {
    try {
      const modelo = req.params.modelo.toLowerCase();
      const productos = await productoService.getProductByModelo(modelo);

      if (!productos) return res.status(404).json({ error: 'Productos no encontrados' });
      res.json(productos);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async update(req, res) {
    try {
      let updateData = { ...req.body };
      // Si se subieron nuevas imágenes, actualiza el campo imagenes
      if (req.files && req.files.length > 0) {
        updateData.imagenes = req.files.map(file => `/uploads/${file.filename}`);
      }
      const producto = await productoService.updateProducto(req.params.id, updateData);
      if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
      res.json(producto);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async delete(req, res) {
    try {
      // 1. Buscar el producto antes de eliminarlo para obtener las imágenes
      const producto = await productoService.getProductoById(req.params.id);
      if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

      // 2. Borrar las imágenes físicas si existen
      if (producto.imagenes && Array.isArray(producto.imagenes)) {
        producto.imagenes.forEach((imgPath) => {
          // Solo borra si es una ruta local
          if (typeof imgPath === 'string' && imgPath.startsWith('/uploads/')) {
            const filePath = path.join(process.cwd(), imgPath);
            fs.unlink(filePath, (err) => {
              // No lanzar error si no existe, solo loguear
              if (err && err.code !== 'ENOENT') {
                console.error('Error al borrar imagen:', filePath, err);
              }
            });
          }
        });
      }

      // 3. Eliminar el producto de la base de datos
      const deleted = await productoService.deleteProducto(req.params.id);
      res.json({ mensaje: 'Producto eliminado', producto: deleted });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};