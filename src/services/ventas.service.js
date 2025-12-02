import { ProductoModel } from "../dao/models/ProductoSchema.js";
import { VentasDAOMongo } from "../dao/index.js";

class VentasService {
  constructor(dao) {
    this.dao = dao;
  }

  async createVenta(data) {
    try {
      const producto = await ProductoModel.findById(data.productoId);
      if (!producto) throw new Error("Producto no encontrado");

      const valorEnvio = data.valorEnvio || 0;
      const precioUnitario = producto.precio;
      const subtotal = precioUnitario * data.cantidad;
      const valorTotal = subtotal + valorEnvio;
      const restan = valorTotal - (data.seña || 0);
      if (data.cantidad <= 0)
        throw new Error("La cantidad debe ser mayor a cero");
      if (data.seña > valorTotal)
        throw new Error("La seña no puede ser mayor al total");

      const ventaLimpia = {
        fecha: data.fecha || new Date(),
        cliente: data.cliente,
        medio: data.medio,
        producto: data.productoId,
        productoNombre: data.productoNombre || "",
        plantilla: data.plantillaId || null,
        cantidad: data.cantidad,
        descripcion: (data.descripcion ?? data.descripcionVenta) || "",
        valorEnvio: data.valorEnvio || 0,
        seña: data.seña || 0,
        valorTotal,
        restan,
        fechaLimite: data.fechaLimite || null,
        // estado por defecto si no se provee
        estado: data.estado || "pendiente",
      };

      const nuevaVenta = await this.dao.create(ventaLimpia);
      return nuevaVenta;
    } catch (error) {
      console.error("Error al crear la venta:", error);
      throw new Error("No se pudo crear la venta");
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
    if (typeof data.productoId !== 'undefined') merged.producto = data.productoId;
    if (typeof data.productoNombre !== 'undefined') merged.productoNombre = data.productoNombre;
    if (typeof data.plantillaId !== 'undefined') merged.plantilla = data.plantillaId;
    if (typeof data.cantidad !== 'undefined') merged.cantidad = data.cantidad;
    if (typeof data.descripcion !== 'undefined') merged.descripcion = data.descripcion;
    if (typeof data.descripcionVenta !== 'undefined') merged.descripcion = data.descripcionVenta;
    if (typeof data.valorEnvio !== 'undefined') merged.valorEnvio = data.valorEnvio;
    if (typeof data.seña !== 'undefined') merged.seña = data.seña;
    if (typeof data.estado !== 'undefined') merged.estado = data.estado;

    // fechaLimite: parseo seguro
    if (typeof data.fechaLimite !== 'undefined') {
      if (!data.fechaLimite) merged.fechaLimite = null;
      else if (typeof data.fechaLimite === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data.fechaLimite)) {
        const [y, m, d] = data.fechaLimite.split('-').map(Number);
        merged.fechaLimite = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
      } else merged.fechaLimite = data.fechaLimite;
    }

    // Recalcular valorTotal/restan sólo si cambió producto/cantidad/valorEnvio/seña
    const needsRecalc = ['productoId', 'cantidad', 'valorEnvio', 'seña'].some(k => typeof data[k] !== 'undefined');
    if (needsRecalc) {
      let producto = null;
      if (typeof data.productoId !== 'undefined') {
        producto = await ProductoModel.findById(data.productoId);
        if (!producto) throw new Error('Producto no encontrado');
      } else {
        producto = actual.producto && actual.producto.precio ? actual.producto : null;
      }
      const precioUnitario = producto ? producto.precio : 0;
      const cantidad = typeof merged.cantidad !== 'undefined' ? merged.cantidad : 0;
      if (cantidad <= 0) throw new Error('La cantidad debe ser mayor a cero');
      const subtotal = precioUnitario * cantidad;
      const valorEnvio = typeof merged.valorEnvio !== 'undefined' ? merged.valorEnvio : 0;
      const valorTotal = subtotal + valorEnvio;
      const seña = typeof merged.seña !== 'undefined' ? merged.seña : 0;
      if (seña > valorTotal) throw new Error('La seña no puede ser mayor al total');
      merged.valorTotal = valorTotal;
      merged.restan = valorTotal - seña;
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
