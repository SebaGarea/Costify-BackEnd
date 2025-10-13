import mongoose, { Schema } from "mongoose";

const VentasSchema = new Schema(
  {
    fecha: { type: Date, default: Date.now },
    cliente: { type: String, required: true },
    medio: { type: String, required: true },
    producto: {
      type: Schema.Types.ObjectId,
      ref: "Producto", // Referencia al modelo Producto
      required: true,
    },
    productoNombre: {
      type: String,
      required: false,
      default: ""
    },
    plantilla: {
      type: Schema.Types.ObjectId,
      ref: "PlantillaCosto", // Referencia al modelo PlantillaCosto
      required: false, // Puede ser opcional si no siempre hay plantilla asociada
    },
    cantidad: { type: Number, required: true },
  descripcion: { type: String },
    valorEnvio: { type: Number, default: 0 },
    valorTotal: { type: Number, required: true },
    seña: { type: Number, default: 0 },
    restan: { type: Number, required: true },
    estado: {
      type: String,
      enum: ["pendiente", "en_proceso", "finalizada", "cancelada"],
      default: "pendiente",
    },
  },
  { timestamps: true }
);

// Índices para mejorar rendimiento en ordenamientos y filtros más comunes
VentasSchema.index({ fecha: -1 });
VentasSchema.index({ cliente: 1, fecha: -1, createdAt: -1 });
VentasSchema.index({ estado: 1, fecha: -1, createdAt: -1 });
VentasSchema.index({ createdAt: -1 });

export const VentasModel = mongoose.model("Ventas", VentasSchema);
