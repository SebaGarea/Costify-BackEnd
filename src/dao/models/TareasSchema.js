import mongoose, { Schema } from "mongoose";

const TareasSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    notes: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["pendiente", "hecho"],
      default: "pendiente",
      index: true,
    },
    priority: {
      type: String,
      enum: ["baja", "media", "alta"],
      default: "media",
      index: true,
    },
    dueDate: { type: Date, default: null, index: true },
    tags: {
      type: [String],
      enum: ["presupuesto", "cliente", "otros"],
      default: [],
      index: true,
    },
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

TareasSchema.index({ createdAt: -1, _id: -1 });
TareasSchema.index({ status: 1, dueDate: 1, createdAt: -1 });

export const TareasModel = mongoose.model("Tareas", TareasSchema);
