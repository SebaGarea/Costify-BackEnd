import mongoose, { Schema } from "mongoose";

const EventoCalendarioSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    fecha: { type: Date, required: true, index: true },
    hora: { type: String, default: "", trim: true },
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

EventoCalendarioSchema.index({ fecha: 1, createdAt: -1 });

export const EventoCalendarioModel = mongoose.model(
  "EventoCalendario",
  EventoCalendarioSchema
);
