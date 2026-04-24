import mongoose from "mongoose";
const { Schema } = mongoose;

const ConfiguracionSchema = new Schema(
  {
    precioPinturaM2: { type: Number, default: 15000 },
    materiaPrimaPinturaId: { type: Schema.Types.ObjectId, ref: "materias_primas", default: null },
  },
  { timestamps: true }
);

export const ConfiguracionModel = mongoose.model("configuracion", ConfiguracionSchema);
