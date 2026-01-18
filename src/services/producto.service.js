import { ProductoDAOMongo } from '../dao/index.js';
import { computePlanillaPricing } from '../utils/pricing.js';

const toPlain = (doc) => {
  if (!doc) return null;
  return typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
};

const attachPrecioActual = async (producto) => {
  if (!producto) return producto;
  const plainProducto = toPlain(producto);
  let precioActual = Number(plainProducto.precio ?? 0);

  const planilla = plainProducto.planillaCosto ? toPlain(plainProducto.planillaCosto) : null;
  if (planilla && Array.isArray(planilla.items) && planilla.items.length > 0) {
    const pricing = await computePlanillaPricing(planilla);
    if (pricing.unitPrice > 0) {
      precioActual = pricing.unitPrice;
    }
  }

  return { ...plainProducto, precioActual };
};

export class ProductoService {
  constructor(dao) {
    this.dao = dao;
  }

  async createProducto(data) {
    const producto = await this.dao.create(data);
    return attachPrecioActual(producto);
  }

  async getAllProductos() {
    const productos = await this.dao.getAll();
    return Promise.all(productos.map(attachPrecioActual));
  }

  async getProductoById(id) {
    const producto = await this.dao.getById(id);
    return attachPrecioActual(producto);
  }

  async getProductByCatalogo(catalogo){
    const productos = await this.dao.getByCatalogo(catalogo);
    return Promise.all(productos.map(attachPrecioActual));
  }
  async getProductByModelo(modelo){
    const productos = await this.dao.getByModelo(modelo);
    return Promise.all(productos.map(attachPrecioActual));
  }

  async updateProducto(id, data) {
    const producto = await this.dao.update(id, data);
    return attachPrecioActual(producto);
  }

  async deleteProducto(id) {
    return await this.dao.delete(id);
  }
}

export const productoService = new ProductoService(ProductoDAOMongo);