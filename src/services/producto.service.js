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

  const planilla = originalPlanilla ? toPlain(originalPlanilla) : null;
  if (planilla && Array.isArray(planilla.items) && planilla.items.length > 0) {
    // SIEMPRE recalcular en vivo con los precios actuales de MP
    // para que el precio del producto refleje cambios en MP sin esperar recalculo background
    const pricing = await computePlanillaPricing(planilla);
    const precioCalculado = Number(pricing.precioFinal ?? pricing.unitPrice ?? 0);
    if (Number.isFinite(precioCalculado) && precioCalculado > 0) {
      precioActual = precioCalculado;
      // Inyectar el precio recalculado en la plantilla devuelta
      planilla.precioFinal = precioCalculado;
      planilla.costoTotal = pricing.costoTotal ?? planilla.costoTotal;
      planilla.ganancia = pricing.ganancia ?? planilla.ganancia;
    }
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

  async sincronizarPreciosDesdeProductosPlanillas() {
    const productos = await this.dao.getAll();
    let updated = 0;
    for (const producto of productos) {
      const planilla = producto.planillaCosto;
      if (!planilla) continue;
      const precioFinal = Number(planilla.precioFinal ?? 0);
      if (!Number.isFinite(precioFinal) || precioFinal <= 0) continue;
      await this.dao.update(producto._id, { precio: precioFinal });
      updated++;
    }
    return { updated };
  }
}

export const productoService = new ProductoService(ProductoDAOMongo);