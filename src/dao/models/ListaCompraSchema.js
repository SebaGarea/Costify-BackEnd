import mongoose from "mongoose";

const { Schema, model } = mongoose;

export const buildDefaultSectionItems = () => ({
  herreria: [],
  carpinteria: [],
  pintura: [],
  otros: [],
});

const ListaCompraSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      default: "global",
    },
    sectionItems: {
      type: Schema.Types.Mixed,
      default: () => buildDefaultSectionItems(),
    },
    efectivoDisponible: {
      type: Number,
      default: 0,
    },
    dineroDigital: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    minimize: false,
  }
);

export const ListaCompraModel = model("ListaCompra", ListaCompraSchema);
