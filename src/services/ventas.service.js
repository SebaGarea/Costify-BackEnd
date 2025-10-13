import { ProductoModel } from "../dao/models/ProductoSchema.js";
import { VentasDAOMongo } from "../dao/VentasDAOMongo.js";

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
    let producto = null;
    if (data.productoId) {
      producto = await ProductoModel.findById(data.productoId);
      if (!producto) throw new Error("Producto no encontrado");
    }

    const valorEnvio = data.valorEnvio || 0;
    const precioUnitario = producto ? producto.precio : 0;
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
      producto: data.productoId || null,
      productoNombre: data.productoNombre || "",
      plantilla: data.plantillaId || null,
      cantidad: data.cantidad,
      descripcion: (data.descripcion ?? data.descripcionVenta) || "",
      valorEnvio: data.valorEnvio || 0,
      seña: data.seña || 0,
      valorTotal,
      restan,
    };
  

    const updatedVenta = await this.dao.update(id, ventaLimpia);
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
