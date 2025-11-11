import { materiaPrimaService } from "../services/materiaPrima.service.js";

export default class MateriaPrimaController {
  static async getAll(req, res, next) {
    try {
      const materiasPrimas = await materiaPrimaService.getAllMateriaPrimas();
      return res.json({
        status: "success",
        materiasPrimas,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const { id } = req.params;
      const materiaPrima = await materiaPrimaService.getMateriaPrimaById(id);
      if (!materiaPrima) {
        const error = new Error("Materia Prima no encontrada");
        error.status = 404;
        return next(error);
      }
      return res.json({
        status: "success",
        materiaPrima,
      });
    } catch (error) {
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
        const error = new Error("No se pudo crear la materia prima");
        error.status = 400;
        return next(error);
      }

      return res.status(201).json({
        status: "success",
        materiaPrima: createdMateriaPrima,
      });
    } catch (error) {
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
        const error = new Error("No se pudo actualizar la materia prima");
        error.status = 400;
        return next(error);
      }

      return res.json({
        status: "success",
        message: "Materia Prima actualizada correctamente",
        materiaPrima: updatedMateriaPrima,
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const { id } = req.params;

      if (!id) {
        const error = new Error("ID de Materia Prima es requerido");
        error.status = 400;
        return next(error);
      }

      const deletedMateriaPrima = await materiaPrimaService.deleteMateriaPrima(
        id
      );

      if (!deletedMateriaPrima) {
      const error = new Error("No se pudo eliminar la materia prima");
      error.status = 400;
      return next(error);
    }

      return res.json({
        status: "success",
        message: "Materia Prima eliminada correctamente",
      });
    } catch (error) {
      next(error);
    }
  }

  static async getByCategory(req, res, next) {
    try {
      const { category } = req.params;
      const materiasPrimas =
        await materiaPrimaService.getMateriaPrimasByCategory(category);

      if (!materiasPrimas || materiasPrimas.length === 0) {
      const error = new Error(`No se encontraron materias primas en la categoría ${category}`);
      error.status = 404;
      return next(error);
    }

      return res.json({
        status: "success",
        materiasPrimas,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAllCategories(req, res, next) {
    try {
      const categorias = await materiaPrimaService.getAllCategories();
      if(!categorias || categorias.length === 0){
        const error = new Error("No se encontraron categorías");
      error.status = 404;
      return next(error);
      }
      // Transformar a array de objetos con propiedad nombre
      const categoriasObj = categorias.map((nombre) => ({ nombre }));
      return res.json({
        status: "success",
        categorias: categoriasObj,
      });
    } catch (error) {
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
      const error = new Error("No se encontraron materias primas de ese tipo");
      error.status = 404;
      return next(error);
    }

      return res.json({
        status: "success",
        materiasPrimas,
      });
    } catch (error) {
      next(error);
    }
  }
}
