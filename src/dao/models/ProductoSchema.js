import mongoose from 'mongoose';
const { Schema } = mongoose;

const ProductoSchema = new Schema({
  nombre: { type: String, required: true },
  descripcion: { type: String },
  planillaCosto: { type: Schema.Types.ObjectId, ref: 'PlantillaCosto', required: false, unique:true }, // Relación con la planilla de costos
  imagenes: [{ type: String }], // URLs de imágenes en la nube
  imagenesPublicIds: [{ type: String }], // Identificadores en Cloudinary para su posterior borrado
  catalogo: { type: String, required: true, set: v => v.toLowerCase() }, // Ej: "Muebles", "Sillas", "Mesas", etc.
  modelo: { type: String, required: true, set: v => v.toLowerCase() }, // Nuevo campo para el modelo
  activo: { type: Boolean, default: true },
  precio: { type: Number, required: true },
  stock:{type:Number, default: 0} 
}, { timestamps: true });

export const ProductoModel = mongoose.model('Producto', ProductoSchema);


