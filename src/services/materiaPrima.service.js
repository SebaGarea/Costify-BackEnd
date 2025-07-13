import { MateriaPrimaDAOMongo as MateriaPrimaDao } from "../dao/MateriaPrimaDAOMongo.js";


class MateriaPrimaService {
    constructor(dao){
        this.MateriaPrimaDao = dao;
    }

    async createMateriaPrima(data) {
        return await this.MateriaPrimaDao.create(data);
    }

    async getAllMateriaPrimas() {
        return await this.MateriaPrimaDao.getAll();
    }

    async getMateriaPrimaById(id) {
        return await this.MateriaPrimaDao.getById(id);
    }

    async updateMateriaPrima(id, data) {
        return await this.MateriaPrimaDao.update(id, data);
    }

    async deleteMateriaPrima(id) {
        return await this.MateriaPrimaDao.delete(id);
    }

    async getMateriaPrimasByCategory(category) {
        return await this.MateriaPrimaDao.getByCategory(category);
    }

    async getMateriaPrimasByType(type) {
        return await this.MateriaPrimaDao.getByType(type);
    }

}

export const  materiaPrimaService = new MateriaPrimaService(MateriaPrimaDao);
