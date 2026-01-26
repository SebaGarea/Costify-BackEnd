import { ProductoDAOMongo } from '../dao/index.js';
import { computePlanillaPricing } from '../utils/pricing.js';

const toPlain = (doc) => {
  if (!doc) return null;
  return typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
};

const sumValues = (entries = {}) =>
  Object.values(entries).reduce((total, value) => total + Number(value || 0), 0);

const attachPrecioActual = async (producto) => {
  if (!producto) return producto;
  const plainProducto = toPlain(producto);
  const { planillaCosto: originalPlanilla, ...restoProducto } = plainProducto;
  let precioActual = Number(plainProducto.precio ?? 0);

  let planilla = originalPlanilla ? toPlain(originalPlanilla) : null;
  if (planilla && Array.isArray(planilla.items) && planilla.items.length > 0) {
    const pricing = await computePlanillaPricing(planilla);
    const precioCalculado =
      pricing.precioFinal ??
      pricing.unitPrice ??
      Number(planilla.precioFinal ?? planilla.precio ?? 0);
    if (precioCalculado > 0) {
      precioActual = precioCalculado;
    }

    const costoRecalculado =
      pricing.costoTotal ??
      (sumValues(pricing.subtotalesPorCategoria) + (pricing.extrasTotal ?? 0));
    planilla = {
      ...planilla,
      costoTotal: costoRecalculado,
      precioFinal: precioCalculado || Number(planilla.precioFinal ?? 0),
      subtotalesPorCategoria: pricing.subtotalesPorCategoria,
      extrasTotal: pricing.extrasTotal ?? planilla.extrasTotal ?? 0,
      gananciaCalculada:
        pricing.ganancia ?? (precioCalculado || 0) - (costoRecalculado || 0),
    };
  }

  const resultado = { ...restoProducto, precioActual };
  if (planilla) {
    resultado.planillaCosto = planilla;
  }
  return resultado;
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