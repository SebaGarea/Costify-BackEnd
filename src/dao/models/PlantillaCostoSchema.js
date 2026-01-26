import mongoose from 'mongoose';
const { Schema } = mongoose;

// Cada ítem representa un material usado en la plantilla
const ItemSchema = new Schema({
  materiaPrima: { type: Schema.Types.ObjectId, ref: 'materias_primas', required: false },
  valor: { type: Number, min: 0, default: 0 },
  cantidad: { type: Number, required: true },
  categoria: { type: String, required: true }, // Carpintería, Herrería, Herrajes, Pintura
  gananciaIndividual: { type: Number, min: 0, default: 0 },
  esPersonalizado: { type: Boolean, default: false },
  descripcionPersonalizada: { type: String, trim: true },
  categoriaMP: { type: String, trim: true },
  tipoMP: { type: String, trim: true },
  medidaMP: { type: String, trim: true },
  espesorMP: { type: String, trim: true },
  nombreMadera: { type: String, trim: true }
});

const ExtraSimpleSchema = new Schema(
  {
    valor: { type: Number, default: 0 },
    porcentaje: { type: Number, default: 0 },
  },
  { _id: false }
);

const CampoPersonalizadoSchema = new Schema(
  {
    nombre: { type: String, trim: true },
    valor: { type: Number, default: 0 },
    porcentaje: { type: Number, default: 0 },
  },
  { _id: false }
);

// La plantilla de costos
const PlantillaCostoSchema = new Schema({
  nombre: { type: String, required: true },
  items: [ItemSchema], // Lista de materiales con cantidad y categoría
  
  // Campos de categorización para filtrado
  categoria: { 
    type: String, 
    enum: ['Herrería', 'Carpintería', 'Pintura', 'Otros', 'Mixta'], 
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
  extras: {
    creditoCamioneta: { type: ExtraSimpleSchema, default: () => ({}) },
    envio: { type: ExtraSimpleSchema, default: () => ({}) },
    camposPersonalizados: { type: [CampoPersonalizadoSchema], default: [] },
  },
  extrasTotal: { type: Number, default: 0 },
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