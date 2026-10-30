import mongoose from "mongoose";
const { Schema } = mongoose;

// Lugar donde está la plata: efectivo del taller, billeteras virtuales, bancos.
const CuentaDineroSchema = new Schema(
  {
    nombre: { type: String, required: true, trim: true },
    tipo: { type: String, enum: ["efectivo", "billetera", "banco"], default: "billetera" },
    // Las digitales se suman en "Dinero digital" de la lista de compras.
    esDigital: { type: Boolean, default: true },
    saldoInicial: { type: Number, default: 0 },
    fechaSaldoInicial: { type: Date, default: Date.now },
    color: { type: String, default: "teal", trim: true },
    orden: { type: Number, default: 0 },
    activa: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const CategoriaMovimientoSchema = new Schema(
  {
    nombre: { type: String, required: true, trim: true },
    tipo: { type: String, enum: ["ingreso", "egreso"], required: true },
    color: { type: String, default: "gray", trim: true },
    // Las de sistema las usa la app (cobros de ventas, compras) y no se borran.
    sistema: { type: Boolean, default: false },
    clave: { type: String, default: null }, // identificador interno de las de sistema
    activa: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const MovimientoSchema = new Schema(
  {
    tipo: {
      type: String,
      enum: ["ingreso", "egreso", "transferencia", "ajuste"],
      required: true,
    },
    monto: { type: Number, required: true, min: 0 },
    // Solo para ajustes: si suma o resta al saldo de la cuenta.
    direccion: { type: String, enum: ["+", "-"], default: "+" },
    fecha: { type: Date, required: true },
    cuenta: { type: Schema.Types.ObjectId, ref: "CuentaDinero", required: true },
    cuentaDestino: { type: Schema.Types.ObjectId, ref: "CuentaDinero", default: null },
    categoria: { type: Schema.Types.ObjectId, ref: "CategoriaMovimiento", default: null },
    descripcion: { type: String, default: "", trim: true },
    origen: {
      tipo: {
        type: String,
        enum: ["manual", "venta", "compra", "ajuste"],
        default: "manual",
      },
      venta: { type: Schema.Types.ObjectId, ref: "Ventas", default: null },
      detalleCompra: { type: [Schema.Types.Mixed], default: undefined },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "users", default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: "users", default: null },
  },
  { timestamps: true }
);

MovimientoSchema.index({ fecha: -1, createdAt: -1 });
MovimientoSchema.index({ cuenta: 1 });
MovimientoSchema.index({ cuentaDestino: 1 });
MovimientoSchema.index({ categoria: 1 });
MovimientoSchema.index({ "origen.venta": 1 });

export const CuentaDineroModel = mongoose.model("CuentaDinero", CuentaDineroSchema);
export const CategoriaMovimientoModel = mongoose.model(
  "CategoriaMovimiento",
  CategoriaMovimientoSchema
);
export const MovimientoModel = mongoose.model("Movimiento", MovimientoSchema);
