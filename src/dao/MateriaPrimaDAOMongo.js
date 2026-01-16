import { MateriaPrimaModel } from './models/index.js';

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

    static async getPaginated({ page = 1, limit = 10, filters = {} } = {}) {
        try {
            const safeLimit = Math.max(1, Math.min(100, Number(limit) || 10));
            const safePage = Math.max(1, Number(page) || 1);
            const skip = (safePage - 1) * safeLimit;
            const query = {};
            for (const [key, value] of Object.entries(filters || {})) {
                if (value === undefined || value === null || value === "") {
                    continue;
                }
                if (Array.isArray(value)) {
                    const sanitized = value.map((item) => item?.toString().trim()).filter(Boolean);
                    if (sanitized.length > 0) {
                        query[key] = { $in: sanitized };
                    }
                    continue;
                }
                query[key] = value;
            }

            const [items, total] = await Promise.all([
                MateriaPrimaModel.find(query)
                    .skip(skip)
                    .limit(safeLimit)
                    .lean(),
                MateriaPrimaModel.countDocuments(query),
            ]);

            const filtersWithoutType = { ...query };
            delete filtersWithoutType.type;
            const filtersWithoutMedida = { ...query };
            delete filtersWithoutMedida.medida;

            const [availableTypes, availableMedidas] = await Promise.all([
                MateriaPrimaModel.distinct("type", filtersWithoutType),
                MateriaPrimaModel.distinct("medida", filtersWithoutMedida),
            ]);

            return {
                items,
                total,
                page: safePage,
                limit: safeLimit,
                availableTypes,
                availableMedidas,
            };
        } catch (error) {
            console.error(error);
            throw new Error(`Error al obtener productos paginados de la DB: ${error.message}`);
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

    static async findOneByFields(filter) {
        try {
            return await MateriaPrimaModel.findOne(filter).lean();
        } catch (error) {
            console.error(error);
            throw new Error(`Error al buscar materia prima: ${error.message}`);
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

    static async deleteAll() {
        try {
            return await MateriaPrimaModel.deleteMany({});
        } catch (error) {
            console.error(error);
            throw new Error(`Error al eliminar todas las materias primas: ${error.message}`);
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

    static async getAllCategories() {
        try {
            let categorias = await MateriaPrimaModel.distinct("categoria");
            return categorias;
        } catch (error) {
            console.error(error);
            throw new Error(`Error al obtener categorías: ${error.message}`);
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