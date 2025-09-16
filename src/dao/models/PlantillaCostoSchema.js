import mongoose from 'mongoose';
const { Schema } = mongoose;

// Cada ítem representa un material usado en la plantilla
const ItemSchema = new Schema({
  materiaPrima: { type: Schema.Types.ObjectId, ref: 'MateriaPrimaCollection', required: true },
  cantidad: { type: Number, required: true },
  categoria: { type: String, required: true } // Carpintería, Herrería, Herrajes, Pintura
});

// La plantilla de costos
const PlantillaCostoSchema = new Schema({
  nombre: { type: String, required: true },
  items: [ItemSchema], // Lista de materiales con cantidad y categoría
  porcentajesPorCategoria: { // Ejemplo: { carpinteria: 120, herreria: 150 }
    type: Map,
    of: Number,
    required: true
  },
  costoTotal: { type: Number, default: 0 },
  precioFinal: { type: Number, default: 0 },
  ganancia: { type: Number, default: 0 } 
}, { timestamps: true });

export const PlantillaCostoModel = mongoose.model('PlantillaCosto', PlantillaCostoSchema);