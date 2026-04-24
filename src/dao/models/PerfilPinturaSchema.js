import mongoose from "mongoose";

const PerfilPinturaSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    tipo: {
      type: String,
      required: true,
      enum: ["cuadrado", "rectangular", "redondo", "L"],
    },
    perimetro: { type: Number, required: true, min: 0 },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const PerfilPinturaModel = mongoose.model("perfilesPintura", PerfilPinturaSchema);
