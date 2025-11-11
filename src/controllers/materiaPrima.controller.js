import { materiaPrimaService } from "../services/materiaPrima.service.js";

export default class MateriaPrimaController {
  static async getAll(req, res) {
    try {
      const materiasPrimas = await materiaPrimaService.getAllMateriaPrimas();
      return res.json({
        status: "success",
        materiasPrimas,
      });
    } catch (error) {
      console.error("Error al obtener materias primas:", error);

      return res.status(500).json({
        status: "error",
        error: "Error al obtener materias primas",
      });
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;
      const materiaPrima = await materiaPrimaService.getMateriaPrimaById(id);
      if (!materiaPrima) {
        return res.status(404).json({
          status: "error",
          error: "Materia Prima no encontrada",
        });
      }
      return res.json({
        status: "success",
        materiaPrima,
      });
    } catch (error) {
      console.error("Error al obtener materia prima por ID:", error);
      return res.status(500).json({
        status: "error",
        error: "Error al obtener materia prima por ID",
      });
    }
  }

  static async create(req, res) {
    try {
      const newMateriaPrima = req.body;
      const createdMateriaPrima = await materiaPrimaService.createMateriaPrima(
        newMateriaPrima
      );

      return res.status(201).json({
        status: "success",
        materiaPrima: createdMateriaPrima,
      });
    } catch (error) {
      console.error("Error al crear materia prima:", error);
      return res.status(500).json({
        status: "error",
        error: "Error al crear materia prima",
      });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const updatedData = req.body;

      const updatedMateriaPrima = await materiaPrimaService.updateMateriaPrima(
        id,
        updatedData
      );

      if (!updatedMateriaPrima) {
        return res.status(404).json({
          status: "error",
          error: `Materia Prima con ID ${id} no encontrada`,
        });
      }

      return res.json({
        status: "success",
        message: "Materia Prima actualizada correctamente",
        materiaPrima: updatedMateriaPrima
      });
    } catch (error) {
      console.error("Error al actualizar materia prima:", error);
      return res.status(500).json({
        status: "error",
        error: "Error al actualizar materia prima",
      });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;

      if(!id){
        return res.status(400).json({
          status: "error",
          error: "ID de Materia Prima es requerido",
        });
      }

      const deletedMateriaPrima = await materiaPrimaService.deleteMateriaPrima(id);

      if (!deletedMateriaPrima) {
        return res.status(404).json({
          status: "error",
          error: `Materia Prima con ID ${id} no encontrada`,
        });
      }

      return res.json({
        status: "success",
        message: "Materia Prima eliminada correctamente",
      });
    } catch (error) {
      console.error("Error al eliminar materia prima:", error);
      return res.status(500).json({
        status: "error",
        error: "Error al eliminar materia prima",
      });
    }
  }

  static async getByCategory(req, res) {
    try {
      const { category } = req.params;
      const materiasPrimas = await materiaPrimaService.getMateriaPrimasByCategory(category);

      if (!materiasPrimas || materiasPrimas.length === 0) {
        return res.status(404).json({
          status: "error",
          error: `No se encontraron materias primas en la categoría ${category}`,
        });
      }

      return res.json({
        status: "success",
        materiasPrimas,
      });
    } catch (error) {
      console.error("Error al obtener materias primas por categoría:", error);
      return res.status(500).json({
        status: "error",
        error: "Error al obtener materias primas por categoría",
      });
    }
  }

  static async getAllCategories(req, res) {
  try {
    const categorias = await materiaPrimaService.getAllCategories();
    // Transformar a array de objetos con propiedad nombre
    const categoriasObj = categorias.map(nombre => ({ nombre }));
    return res.json({
      status: "success",
      categorias: categoriasObj,
    });
  } catch (error) {
    console.error("Error al obtener categorías:", error);
    return res.status(500).json({
      status: "error",
      error: "Error al obtener categorías",
    });
  }
}

static async getByType(req, res) {
    try {
      const { type } = req.params;
      const materiasPrimas = await materiaPrimaService.getMateriaPrimasByType(type);

      if (!materiasPrimas || materiasPrimas.length === 0) {
        return res.status(404).json({
          status: "error",
          error: `No se encontraron materias primas del tipo ${type}`,
        });
      }

      return res.json({
        status: "success",
        materiasPrimas,
      });
    } catch (error) {
      console.error("Error al obtener materias primas por tipo:", error);
      return res.status(500).json({
        status: "error",
        error: "Error al obtener materias primas por tipo",
      });
    }
  }

}
