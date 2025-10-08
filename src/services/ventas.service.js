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
        plantilla: data.plantillaId || null,
        cantidad: data.cantidad,
        descripcion: data.descripcion || "",
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

  async getVentaById(id) {
    return await this.dao.getById(id);
  }

  async updateVenta(id, data) {
    try {
      // Actualiza la venta con los datos proporcionados
      const updatedVenta = await this.dao.update(id, data);

      // Recalcula "restan" para asegurar consistencia
      const valorTotal = updatedVenta.valorTotal || 0;
      const valorEnvio = updatedVenta.valorEnvio || 0;
      const seña = updatedVenta.seña || 0;
      updatedVenta.restan = valorTotal + valorEnvio - seña;

      // Guarda el recalculo
      await updatedVenta.save();

      return updatedVenta;
    } catch (error) {
      throw new Error(`Error al actualizar la venta: ${error.message}`);
    }
  }

  async deleteVenta(id) {
    return await this.dao.delete(id);
  }

  async getVentasByCliente(cliente) {
    return await this.dao.getByCliente(cliente);
  }

  async getVentasByEstado(estado) {
    return await this.dao.getByEstado(estado);
  }
}

export const ventasService = new VentasService(VentasDAOMongo);
