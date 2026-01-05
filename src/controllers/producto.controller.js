import fs from 'fs';
import path from 'path';
import logger from '../config/logger.js';
import { productoService, uploadProductImages, deleteCloudinaryAssets } from '../services/index.js';

export const productoController = {
  async create(req, res, next) {
    try {
      let imagenes = [];
      let imagenesPublicIds = [];

      if (req.files && req.files.length > 0) {
        logger.info(`Imágenes recibidas: ${req.files.length}`);
        const uploadResult = await uploadProductImages(req.files);
        imagenes = uploadResult.urls;
        imagenesPublicIds = uploadResult.publicIds;
      }
      const producto = await productoService.createProducto({ ...req.body, imagenes, imagenesPublicIds });
      if(!producto) {
        logger.warn('No se pudo crear el producto', { body: req.body });
        const error = new Error("No se pudo crear el producto");
        error.status = 400;
        return next(error);
      }
      logger.info('Producto creado exitosamente', { id: producto._id });
      res.status(201).json(producto);
    } catch (error) {
      logger.error('Error al crear el producto', { error });
      next(error);
    }
  },

  async getAll(req, res, next) {
    try {
      const productos = await productoService.getAllProductos();
      if (!productos) {
        logger.warn('No se encontraron productos');
        const error = new Error("No se encontraron productos");
        error.status = 404;
        return next(error);
      }
      logger.info('Productos obtenidos exitosamente');
      res.json(productos);
    } catch (error) {
      logger.error('Error al obtener los productos', { error });
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const producto = await productoService.getProductoById(req.params.id);
      if(!producto) {
        logger.warn(`Producto no encontrado, ID: ${req.params.id}`);
        const error = new Error("Producto no encontrado");
        error.status = 404;
        return next(error);
      }
      logger.info(`Producto encontrado, ID: ${req.params.id}`);
      res.json(producto);
    } catch (error) {
      logger.error('Error al obtener el producto', { error });
      next(error);
    }
  },

  async getByCatalogo(req, res, next) {
    try {
      const catalogo = req.params.catalogo.toLowerCase();
      const productos = await productoService.getProductByCatalogo(catalogo);

      if (!productos) {
        logger.warn(`Productos no encontrados para el catálogo, Catálogo: ${catalogo}`);
        const error = new Error("Productos no encontrados");
        error.status = 404;
        return next(error);
      }
      logger.info(`Productos encontrados para el catálogo, Catálogo: ${catalogo}`);
      res.json(productos);
    } catch (error) {
      logger.error('Error al obtener los productos por catálogo', { error });
      next(error);
    }
  },

  async getByModelo(req, res, next) {
    try {
      const modelo = req.params.modelo.toLowerCase();
      const productos = await productoService.getProductByModelo(modelo);

      if (!productos) {
        logger.warn(`Productos no encontrados para el modelo, Modelo: ${modelo}`);
        const error = new Error("Productos no encontrados");
        error.status = 404;
        return next(error);
      }
      logger.info(`Productos encontrados para el modelo, Modelo: ${modelo}`);
      res.json(productos);
    } catch (error) {
      logger.error('Error al obtener los productos por modelo', { error });
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const productoActual = await productoService.getProductoById(req.params.id);
      if(!productoActual) {
        logger.warn(`Producto no encontrado para actualizar, ID: ${req.params.id}`);
        const error = new Error("No se pudo actualizar el producto");
        error.status = 400;
        return next(error);
      }

      let updateData = { ...req.body };
      if (req.files && req.files.length > 0) {
        if (productoActual.imagenesPublicIds && productoActual.imagenesPublicIds.length > 0) {
          await deleteCloudinaryAssets(productoActual.imagenesPublicIds);
        }
        const uploadResult = await uploadProductImages(req.files);
        updateData.imagenes = uploadResult.urls;
        updateData.imagenesPublicIds = uploadResult.publicIds;
      }
      const producto = await productoService.updateProducto(req.params.id, updateData);
      if(!producto) {
        logger.warn(`Producto no encontrado para actualizar, ID: ${req.params.id}`);
        const error = new Error("No se pudo actualizar el producto");
        error.status = 400;
        return next(error);
      }
      logger.info(`Producto actualizado, ID: ${req.params.id}`);
      res.json(producto);
    } catch (error) {
      logger.error('Error al actualizar el producto', { error });
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      // 1. Buscar el producto antes de eliminarlo para obtener las imágenes
      const producto = await productoService.getProductoById(req.params.id);
      if (!producto) {
        logger.warn(`Producto no encontrado para eliminar, ID: ${req.params.id}`);
        const error = new Error("Producto no encontrado");
        error.status = 404;
        return next(error);
      }
      if (producto.imagenesPublicIds && producto.imagenesPublicIds.length > 0) {
        await deleteCloudinaryAssets(producto.imagenesPublicIds);
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
      logger.info(`Producto eliminado, ID: ${req.params.id}`);
      res.json({ mensaje: 'Producto eliminado', producto: deleted });
    } catch (error) {
      logger.error('Error al eliminar el producto', { error });
      next(error);
    }
  }
};