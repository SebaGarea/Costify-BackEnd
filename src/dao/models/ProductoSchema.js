import mongoose from 'mongoose';
const { Schema } = mongoose;

const ProductoSchema = new Schema({
  nombre: { type: String, required: true },
  descripcion: { type: String },
  planillaCosto: { type: Schema.Types.ObjectId, ref: 'PlantillaCosto', required: true }, // Relación con la planilla de costos
  imagenes: [{ type: String }], // URLs de imágenes en la nube
  catalogo: { type: String }, // Ej: "Muebles", "Sillas", "Mesas", etc.
  activo: { type: Boolean, default: true }
}, { timestamps: true });

export const ProductoModel = mongoose.model('Producto', ProductoSchema);