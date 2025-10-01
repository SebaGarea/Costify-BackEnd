import { ProductoModel } from "../dao/models/ProductoSchema.js";
import { VentasDAOMongo } from "../dao/VentasDAOMongo.js";

class VentasService {
  constructor(dao) {
    this.dao = dao;
  }

  async createVenta(data) {
    try {
      const producto = await ProductoModel.getById(data.productoId);
      if (!producto) throw new Error("Producto no encontrado");

      const valorVenta = producto.precio * data.cantidad;
      const total = valorVenta + (data.envio || 0);
      const restan = total - (data.seña || 0);

      if (data.cantidad <= 0) throw new Error("La cantidad debe ser mayor a cero");
      if(data.seña > total) throw new Error("La seña no puede ser mayor al total");
    
    
      const nuevaVenta = await this.dao.create({
        ...data,
        producto: data.productoId,
        valorVenta,
        total,
        restan,
      });

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
    return await this.dao.update(id, data);
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