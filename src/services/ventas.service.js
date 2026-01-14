import { ProductoModel } from "../dao/models/ProductoSchema.js";
import { VentasDAOMongo } from "../dao/index.js";

class VentasService {
  constructor(dao) {
    this.dao = dao;
  }

  async createVenta(data) {
    try {
      const hasProducto = Boolean(data.productoId);
      let producto = null;
      if (hasProducto) {
        producto = await ProductoModel.findById(data.productoId);
        if (!producto) throw new Error("Producto no encontrado");
      }

      const valorEnvio = Number(data.valorEnvio || 0);
      const cantidad = Number(data.cantidad || 0);
      if (cantidad <= 0) throw new Error("La cantidad debe ser mayor a cero");

      const precioManual = Number(data.precioManual || 0);

      let valorTotalCalculado = 0;
      if (hasProducto && producto) {
        const precioUnitario = producto.precio;
        valorTotalCalculado = precioUnitario * cantidad + valorEnvio;
      } else {
        if (precioManual <= 0) throw new Error("El precio manual debe ser mayor a cero");
        valorTotalCalculado = precioManual * cantidad + valorEnvio;
      }

      const seña = Number(data.seña || 0);
      if (seña > valorTotalCalculado)
        throw new Error("La seña no puede ser mayor al total");
      const restan = valorTotalCalculado - seña;

      const ventaLimpia = {
        fecha: data.fecha || new Date(),
        cliente: data.cliente,
        medio: data.medio,
        producto: hasProducto ? data.productoId : null,
        productoNombre: data.productoNombre || "",
        plantilla: data.plantillaId || null,
        cantidad,
        descripcion: (data.descripcion ?? data.descripcionVenta) || "",
        valorEnvio,
        seña,
        valorTotal: valorTotalCalculado,
        restan,
        precioManual: hasProducto ? null : precioManual,
        fechaLimite: data.fechaLimite || null,
        // estado por defecto si no se provee
        estado: data.estado || "pendiente",
      };

      const nuevaVenta = await this.dao.create(ventaLimpia);
      return nuevaVenta;
    } catch (error) {
      console.error("Error al crear la venta:", error);
      throw error;
    }
  }

  async getAllVentas() {
    return await this.dao.getAll();
  }

  async getAllVentasPaginated(page = 1, limit = 10) {
    return await this.dao.getAllPaginated(page, limit);
  }

  async getVentaById(id) {
    return await this.dao.getById(id);
  }

 async updateVenta(id, data) {
  try {
    // Obtener la venta actual (puede venir poblada por DAO)
    const actual = await this.dao.getById(id);
    if (!actual) throw new Error("Venta no encontrada");

    // Construir objeto merged partiendo de la venta actual
    const merged = { ...actual };

    // Aplicar solo campos definidos en data
    if (typeof data.fecha !== 'undefined') merged.fecha = data.fecha;
    if (typeof data.cliente !== 'undefined') merged.cliente = data.cliente;
    if (typeof data.medio !== 'undefined') merged.medio = data.medio;
    const hasProductoId = typeof data.productoId !== 'undefined' && data.productoId !== null && data.productoId !== '';
    if (hasProductoId) {
      merged.producto = data.productoId;
    } else if (typeof data.productoId !== 'undefined') {
      merged.producto = null;
    }
    if (typeof data.productoNombre !== 'undefined') merged.productoNombre = data.productoNombre;
    if (typeof data.plantillaId !== 'undefined') merged.plantilla = data.plantillaId;
    if (typeof data.cantidad !== 'undefined') merged.cantidad = data.cantidad;
    if (typeof data.descripcion !== 'undefined') merged.descripcion = data.descripcion;
    if (typeof data.descripcionVenta !== 'undefined') merged.descripcion = data.descripcionVenta;
    if (typeof data.valorEnvio !== 'undefined') merged.valorEnvio = data.valorEnvio;
    if (typeof data.seña !== 'undefined') merged.seña = data.seña;
    if (typeof data.restan !== 'undefined') {
      const restanValue = Number(data.restan);
      merged.restan = Number.isNaN(restanValue) ? merged.restan : restanValue;
    }
    if (typeof data.estado !== 'undefined') merged.estado = data.estado;
    if (typeof data.precioManual !== 'undefined') merged.precioManual = data.precioManual;

    // fechaLimite: parseo seguro
    if (typeof data.fechaLimite !== 'undefined') {
      if (!data.fechaLimite) merged.fechaLimite = null;
      else if (typeof data.fechaLimite === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data.fechaLimite)) {
        const [y, m, d] = data.fechaLimite.split('-').map(Number);
        merged.fechaLimite = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
      } else merged.fechaLimite = data.fechaLimite;
    }

    // Recalcular valorTotal/restan sólo si cambió producto/cantidad/valorEnvio/seña
    const needsRecalc = [
      typeof data.productoId !== 'undefined',
      typeof data.cantidad !== 'undefined',
      typeof data.valorEnvio !== 'undefined',
      typeof data.seña !== 'undefined',
      typeof data.precioManual !== 'undefined'
    ].some(Boolean);
    if (needsRecalc) {
      const cantidad = Number(typeof merged.cantidad !== 'undefined' ? merged.cantidad : 0);
      if (cantidad <= 0) throw new Error('La cantidad debe ser mayor a cero');
      const valorEnvioActual = Number(typeof merged.valorEnvio !== 'undefined' ? merged.valorEnvio : 0);
      const señaActual = Number(typeof merged.seña !== 'undefined' ? merged.seña : 0);

      let valorTotal = 0;
      if (merged.producto) {
        let producto = null;
        if (typeof merged.producto === 'object' && merged.producto.precio) {
          producto = merged.producto;
        } else {
          const productoId = typeof merged.producto === 'object' && merged.producto._id
            ? merged.producto._id
            : merged.producto;
          producto = await ProductoModel.findById(productoId);
        }
        if (!producto) throw new Error('Producto no encontrado');
        valorTotal = producto.precio * cantidad + valorEnvioActual;
        merged.precioManual = null;
      } else {
        const precioManual = Number(
          typeof merged.precioManual !== 'undefined' && merged.precioManual !== null
            ? merged.precioManual
            : typeof actual.precioManual !== 'undefined'
              ? actual.precioManual
              : 0
        );
        if (precioManual <= 0) throw new Error('El precio manual debe ser mayor a cero');
        valorTotal = precioManual * cantidad + valorEnvioActual;
        merged.precioManual = precioManual;
      }

      if (señaActual > valorTotal) throw new Error('La seña no puede ser mayor al total');
      merged.valorTotal = valorTotal;
      merged.restan = valorTotal - señaActual;
    }

    // Manejar timestamps para en_proceso
    if (typeof data.estado !== 'undefined') {
      if (data.estado === 'en_proceso') merged.enProcesoAt = new Date();
      else merged.enProcesoAt = null;
    }

    const updatedVenta = await this.dao.update(id, merged);
    return updatedVenta;
  } catch (error) {
    throw new Error(`Error al actualizar la venta: ${error.message}`);
  }
}

async deleteVenta(id) {
    return await this.dao.delete(id);
  }
}
export const ventasService = new VentasService(VentasDAOMongo);
export { VentasService };
