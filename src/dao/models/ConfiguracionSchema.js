import mongoose from "mongoose";
const { Schema } = mongoose;

const PorcentajesPlataformasSchema = new Schema(
  {
    mercadoLibreBase:       { type: Number, default: 14 },
    mercadoLibreInteresBajo:{ type: Number, default: 4 },
    mercadoLibre3Cuotas:    { type: Number, default: 8.2 },
    mercadoLibre6Cuotas:    { type: Number, default: 12.7 },
    mercadoLibre9Cuotas:    { type: Number, default: 17.4 },
    mercadoLibre12Cuotas:   { type: Number, default: 21.8 },
    nubeVentaBase:          { type: Number, default: 10 },
    nubeCuotasExtra:        { type: Number, default: 17 },
  },
  { _id: false }
);

const ConfiguracionSchema = new Schema(
  {
    precioPinturaM2: { type: Number, default: 15000 },
    materiaPrimaPinturaId: { type: Schema.Types.ObjectId, ref: "materias_primas", default: null },
    porcentajesPlataformas: { type: PorcentajesPlataformasSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export const ConfiguracionModel = mongoose.model("configuracion", ConfiguracionSchema);
