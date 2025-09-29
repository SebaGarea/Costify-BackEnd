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
  
  // Campos de categorización para filtrado
  categoria: { 
    type: String, 
    enum: ['Herrería', 'Carpintería', 'Pintura', 'Mixta'], 
    required: false, // Opcional para compatibilidad con plantillas existentes
    default: 'Mixta'
  },
  tipoProyecto: { 
    type: String, 
    required: false, // Opcional para compatibilidad
    default: 'Otro',
    trim: true // Permitir cualquier string, sin enum rígido
  },
  tags: [{ 
    type: String,
    trim: true,
    lowercase: true
  }], // Tags para búsqueda específica: ['exterior', 'interior', 'comercial', 'residencial']
  
  porcentajesPorCategoria: { // Ejemplo: { carpinteria: 120, herreria: 150 }
    type: Map,
    of: Number,
    required: true
  },
  consumibles: { // Consumibles por categoría
    type: Map,
    of: Number,
    default: () => new Map()
  },
  costoTotal: { type: Number, default: 0 },
  subtotales: { // Subtotales por categoría
    type: Map,
    of: Number,
    default: () => new Map()
  },
  precioFinal: { type: Number, default: 0 },
  ganancia: { type: Number, default: 0 } 
}, { timestamps: true });

export const PlantillaCostoModel = mongoose.model('PlantillaCosto', PlantillaCostoSchema);