import { MateriaPrimaModel } from './models/MateriaPrimaSchema.js';

export class MateriaPrimaDAOMongo {

    static async create(MateriaPrima){
        try {
            let nuevaMateriaPrima = await MateriaPrimaModel.create(MateriaPrima);
            return nuevaMateriaPrima.toObject();
        } catch (error) {
            console.error(error)
            throw new Error(`Error al crear producto en DB: ${error.message}`);
        }
    }

    static async getAll() {
        try {
            let materiasPrimas = await MateriaPrimaModel.find().lean();
            return materiasPrimas;
        } catch (error) {
            console.error(error);
            throw new Error(`Error al obtener productos de la DB: ${error.message}`);
        }
    }

    static async getById(id) {
        try {
            let materiaPrima = await MateriaPrimaModel.findById(id).lean();
            if (!materiaPrima) {
                throw new Error(`Materia Prima con ID ${id} no encontrada`);
            }
            return materiaPrima;
        } catch (error) {
            console.error(error);
            throw new Error(`Error al obtener producto por ID: ${error.message}`);
        }
    }

    static async update(id, updatedMateriaPrima) {
        try {
            let materiaPrimaActualizada = await MateriaPrimaModel.findByIdAndUpdate(id, updatedMateriaPrima, { new: true }).lean();
            if (!materiaPrimaActualizada) {
                throw new Error(`Materia Prima con ID ${id} no encontrada`);
            }
            return materiaPrimaActualizada;
        } catch (error) {
            console.error(error);
            throw new Error(`Error al actualizar producto: ${error.message}`);
        }
    }

    static async delete(id) {
        try {
            let materiaPrimaEliminada = await MateriaPrimaModel.findByIdAndDelete(id).lean();
            if (!materiaPrimaEliminada) {
                throw new Error(`Materia Prima con ID ${id} no encontrada`);
            }
            return materiaPrimaEliminada;
        } catch (error) {
            console.error(error);
            throw new Error(`Error al eliminar producto: ${error.message}`);
        }
    }

    static async getByCategory(category) {
        try {
            let materiasPrimas = await MateriaPrimaModel.find({ categoria: category }).lean();
            return materiasPrimas;
        } catch (error) {
            console.error(error);
            throw new Error(`Error al obtener productos por categoría: ${error.message}`);
        }
    }

    static async getByType(type) {
        try {
            let materiasPrimas = await MateriaPrimaModel.find({ type: type }).lean();
            return materiasPrimas;
        } catch (error) {
            console.error(error);
            throw new Error(`Error al obtener productos por tipo: ${error.message}`);
        }
    }

}