import mongoose, { Schema } from "mongoose";

const ChecklistItemSchema = new Schema(
  {
    text: { type: String, required: true, trim: true },
    done: { type: Boolean, default: false },
  },
  { _id: false }
);

const ContenidoSchema = new Schema(
  {
    titulo: { type: String, required: true, trim: true },
    estado: {
      type: String,
      enum: ["idea", "produccion", "edicion", "listo", "publicado"],
      default: "idea",
      index: true,
    },
    canales: {
      type: [String],
      enum: ["instagram", "facebook", "tiktok", "tiendanube"],
      default: ["instagram", "facebook"],
      index: true,
    },
    tipo: {
      type: String,
      enum: ["foto", "reel", "carrusel", "historia", "otro"],
      default: "foto",
    },
    fechaPublicacion: { type: Date, default: null, index: true },
    producto: {
      type: Schema.Types.ObjectId,
      ref: "Producto",
      default: null,
      index: true,
    },
    responsable: {
      type: Schema.Types.ObjectId,
      ref: "users",
      default: null,
      index: true,
    },
    copy: { type: String, default: "", trim: true },
    notas: { type: String, default: "", trim: true },
    checklist: { type: [ChecklistItemSchema], default: [] },
    orden: { type: Number, default: 0 },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "users",
      default: null,
    },
  },
  { timestamps: true }
);

ContenidoSchema.index({ estado: 1, orden: 1, createdAt: -1 });
ContenidoSchema.index({ producto: 1, fechaPublicacion: -1 });

export const ContenidoModel = mongoose.model("Contenido", ContenidoSchema);
