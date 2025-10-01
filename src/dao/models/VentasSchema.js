import mongoose, { Schema } from "mongoose";

const VentasSchema = new Schema({
  fecha: { type: Date, default: Date.now },
  cliente: { type: String, required: true },
  medio: { type: String, required: true },
  producto: {
    type: Schema.Types.ObjectId,
    ref: "Producto", // Referencia al modelo Producto
    required: true,
  },
  plantilla: {
    type: Schema.Types.ObjectId,
    ref: "PlantillaCosto", // Referencia al modelo PlantillaCosto
    required: false, // Puede ser opcional si no siempre hay plantilla asociada
  },
  cantidad: { type: Number, required: true },
  descripcion: { type: String },
  valorEnvio: { type: Number, default: 0 },
  valorSeña: { type: Number, default: 0 },
  valorTotal: {
    type: { type: Number, required: true },
  },
  seña: { type: Number, default: 0 },
  restan: {
    type: Number,
    default: function () {
      return this.total + this.valorEnvio - this.seña;
    },
  },
  estado: {
    type: String,
    enum: ["pendiente", "en_proceso", "finalizada", "cancelada"],
    default: "pendiente",
  },
}, { timestamps: true });

export const VentasModel = mongoose.model("Ventas", VentasSchema);
