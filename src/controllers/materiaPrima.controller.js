import { materiaPrimaService } from "../services/index.js";
import logger from "../config/logger.js";


export class MateriaPrimaController {
  static async getAll(req, res, next) {
    try {
      const materiasPrimas = await materiaPrimaService.getAllMateriaPrimas();
      if(!materiasPrimas || materiasPrimas.length === 0){
        logger.warn("No se encontraron materias primas");
        const error = new Error("No se encontraron materias primas");
        error.status = 404;
        return next(error);
      }
      logger.info("Materias primas obtenidas exitosamente");
      return res.json({
        status: "success",
        materiasPrimas,
      });
    } catch (error) {
      logger.error('Error al obtener las materias primas', { error });
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const { id } = req.params;
      const materiaPrima = await materiaPrimaService.getMateriaPrimaById(id);
      if (!materiaPrima) {
        logger.warn(`Materia Prima no encontrada, ID: ${id}`);
        const error = new Error("Materia Prima no encontrada");
        error.status = 404;
        return next(error);
      }
      logger.info(`Materia Prima encontrada, ID: ${id}`);
      return res.json({
        status: "success",
        materiaPrima,
      });
    } catch (error) {
      logger.error('Error al obtener la materia prima', { error });
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const newMateriaPrima = req.body;
      const createdMateriaPrima = await materiaPrimaService.createMateriaPrima(
        newMateriaPrima
      );
      if (!createdMateriaPrima) {
        logger.warn("No se pudo crear la materia prima", { newMateriaPrima });
        const error = new Error("No se pudo crear la materia prima");
        error.status = 400;
        return next(error);
      }
      logger.info("Materia Prima creada exitosamente", { id: createdMateriaPrima._id });
      return res.status(201).json({
        status: "success",
        materiaPrima: createdMateriaPrima,
      });
    } catch (error) {
      logger.error('Error al crear la materia prima', { error });
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const updatedData = req.body;

      const updatedMateriaPrima = await materiaPrimaService.updateMateriaPrima(
        id,
        updatedData
      );

      if (!updatedMateriaPrima) {
        logger.warn(`No se pudo actualizar la materia prima, ID: ${id}`);
        const error = new Error("No se pudo actualizar la materia prima");
        error.status = 400;
        return next(error);
      }
      logger.info(`Materia Prima actualizada, ID: ${id}`);
      return res.json({
        status: "success",
        message: "Materia Prima actualizada correctamente",
        materiaPrima: updatedMateriaPrima,
      });
    } catch (error) {
      logger.error('Error al actualizar la materia prima', { error });
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const { id } = req.params;

      if (!id) {
        logger.warn("ID de Materia Prima es requerido");
        const error = new Error("ID de Materia Prima es requerido");
        error.status = 400;
        return next(error);
      }

      const deletedMateriaPrima = await materiaPrimaService.deleteMateriaPrima(
        id
      );

      if (!deletedMateriaPrima) {
        logger.warn(`No se pudo eliminar la materia prima, ID: ${id}`);
      const error = new Error("No se pudo eliminar la materia prima");
      error.status = 400;
      return next(error);
    }
      logger.info(`Materia Prima eliminada, ID: ${id}`);
      return res.json({
        status: "success",
        message: "Materia Prima eliminada correctamente",
      });
    } catch (error) {
      logger.error('Error al eliminar la materia prima', { error });
      next(error);
    }
  }

  static async getByCategory(req, res, next) {
    try {
      const { category } = req.params;
      const materiasPrimas =
        await materiaPrimaService.getMateriaPrimasByCategory(category);

      if (!materiasPrimas || materiasPrimas.length === 0) {
        logger.warn(`No se encontraron materias primas en la categoría ${category}`);
      const error = new Error(`No se encontraron materias primas en la categoría ${category}`);
      error.status = 404;
      return next(error);
    }
      logger.info(`Materias primas obtenidas por categoría: ${category}`);
      return res.json({
        status: "success",
        materiasPrimas,
      });
    } catch (error) {
      logger.error('Error al obtener las materias primas por categoría', { error });
      next(error);
    }
  }

  static async getAllCategories(req, res, next) {
    try {
      const categorias = await materiaPrimaService.getAllCategories();
      if(!categorias || categorias.length === 0){
        logger.warn("No se encontraron categorías");
        const error = new Error("No se encontraron categorías");
      error.status = 404;
      return next(error);
      }
      // Transformar a array de objetos con propiedad nombre
      const categoriasObj = categorias.map((nombre) => ({ nombre }));
      logger.info("Categorías obtenidas exitosamente");
      return res.json({
        status: "success",
        categorias: categoriasObj,
      });
    } catch (error) {
      logger.error('Error al obtener las categorías', { error });
      next(error);
    }
  }

  static async getByType(req, res, next) {
    try {
      const { type } = req.params;
      const materiasPrimas = await materiaPrimaService.getMateriaPrimasByType(
        type
      );

      if (!materiasPrimas || materiasPrimas.length === 0) {
        logger.warn(`No se encontraron materias primas de tipo ${type}`);
      const error = new Error("No se encontraron materias primas de ese tipo");
      error.status = 404;
      return next(error);
    }
      logger.info(`Materias primas obtenidas por tipo: ${type}`);
      return res.json({
        status: "success",
        materiasPrimas,
      });
    } catch (error) {
      logger.error('Error al obtener las materias primas por tipo', { error });
      next(error);
    }
  }
}
