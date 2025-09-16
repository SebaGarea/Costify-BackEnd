import { ProductoDAOMongo } from '../dao/ProductoDAOMongo.js';

class ProductoService {
  constructor(dao) {
    this.dao = dao;
  }

  async createProducto(data) {
    return await this.dao.create(data);
  }

  async getAllProductos() {
    return await this.dao.getAll();
  }

  async getProductoById(id) {
    return await this.dao.getById(id);
  }

  async getProductByCatalogo(catalogo){
    return await this.dao.getByCatalogo(catalogo);
  }
  async getProductByModelo(modelo){
    return await this.dao.getByModelo(modelo);
  }

  async updateProducto(id, data) {
    return await this.dao.update(id, data);
  }

  async deleteProducto(id) {
    return await this.dao.delete(id);
  }
}

export const productoService = new ProductoService(ProductoDAOMongo);