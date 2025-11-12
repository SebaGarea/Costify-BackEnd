import { productoService } from '../services/producto.service.js';
import fs from 'fs';
import path from 'path';

export const productoController = {
  async create(req, res, next) {
    try {
      let imagenes = [];

      if (req.files && req.files.length > 0) {
        imagenes = req.files.map(file => `/uploads/${file.filename}`);
      }
      const producto = await productoService.createProducto({ ...req.body, imagenes });
      if(!producto) {
        const error = new Error("No se pudo crear el producto");
        error.status = 400;
        return next(error);
      }
      res.status(201).json(producto);
    } catch (error) {
      next(error);
    }
  },

  async getAll(req, res, next) {
    try {
      const productos = await productoService.getAllProductos();
      if (!productos) {
        const error = new Error("No se encontraron productos");
        error.status = 404;
        return next(error);
      }
      res.json(productos);
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const producto = await productoService.getProductoById(req.params.id);
      if(!producto) {
        const error = new Error("Producto no encontrado");
        error.status = 404;
        return next(error);
      }
      res.json(producto);
    } catch (error) {
      next(error);
    }
  },

  async getByCatalogo(req, res, next) {
    try {
      const catalogo = req.params.catalogo.toLowerCase();
      const productos = await productoService.getProductByCatalogo(catalogo);

      if (!productos) {
        const error = new Error("Productos no encontrados");
        error.status = 404;
        return next(error);
      }
      res.json(productos);
    } catch (error) {
      next(error);
    }
  },

  async getByModelo(req, res, next) {
    try {
      const modelo = req.params.modelo.toLowerCase();
      const productos = await productoService.getProductByModelo(modelo);

      if (!productos) {
        const error = new Error("Productos no encontrados");
        error.status = 404;
        return next(error);
      }
      res.json(productos);
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      let updateData = { ...req.body };
      // Si se subieron nuevas imágenes, actualiza el campo imagenes
      if (req.files && req.files.length > 0) {
        updateData.imagenes = req.files.map(file => `/uploads/${file.filename}`);
      }
      const producto = await productoService.updateProducto(req.params.id, updateData);
      if(!producto) {
        const error = new Error("No se pudo actualizar el producto");
        error.status = 400;
        return next(error);
      }
      res.json(producto);
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      // 1. Buscar el producto antes de eliminarlo para obtener las imágenes
      const producto = await productoService.getProductoById(req.params.id);
      if (!producto) {
        const error = new Error("Producto no encontrado");
        error.status = 404;
        return next(error);
      }
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
      const deleted = await productoService.deleteProducto(req.params.id);
      res.json({ mensaje: 'Producto eliminado', producto: deleted });
    } catch (error) {
      next(error);
    }
  }
};