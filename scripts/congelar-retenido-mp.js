// Pasa a modo manual la plata "a liberar" que quedó de la importación de Mercado Pago.
//
// Hoy el disponible de cada cuenta descuenta lo retenido (movimientos con fecha de
// liberación futura) y lo suma solo cuando llega esa fecha. En modo manual eso no
// debe pasar: este script deja el saldo EXACTAMENTE como se ve ahora y lo congela.
//   - crea un ajuste negativo por lo retenido de cada cuenta
//   - borra la fecha de liberación de esos movimientos (ya no cambian con el tiempo)
//
// Uso (dentro del contenedor api):
//   node scripts/congelar-retenido-mp.js            -> solo muestra qué haría
//   node scripts/congelar-retenido-mp.js --aplicar  -> lo aplica
import mongoose from "mongoose";
import { config } from "../src/config/config.js";
import { MovimientoModel, CuentaDineroModel } from "../src/dao/models/index.js";
import { calcularALiberar } from "../src/services/caja.service.js";

const aplicar = process.argv.includes("--aplicar");

await mongoose.connect(config.MONGO_URL, { dbName: config.DB_NAME });
const retenidos = await calcularALiberar({ forzar: true });
const cuentas = await CuentaDineroModel.find({ _id: { $in: [...retenidos.keys()] } }).lean();
const ahora = new Date();
const pendientes = await MovimientoModel.countDocuments({ liberacion: { $gt: ahora } });

if (!retenidos.size) console.log("No hay plata a liberar: nada que hacer.");
for (const c of cuentas) {
  const r = Math.round((retenidos.get(String(c._id)) || 0) * 100) / 100;
  console.log(`${c.nombre}: retenido ${r.toLocaleString("es-AR")} -> ajuste de -${r.toLocaleString("es-AR")}`);
  if (aplicar && r > 0) {
    await MovimientoModel.create({
      tipo: "ajuste",
      direccion: "-",
      monto: r,
      fecha: ahora,
      cuenta: c._id,
      descripcion: "Paso a modo manual: se quita lo que estaba a liberar de Mercado Pago",
      origen: { tipo: "ajuste" },
    });
  }
}
console.log(`Movimientos con liberación futura: ${pendientes}`);
if (aplicar) {
  const r = await MovimientoModel.updateMany({ liberacion: { $ne: null } }, { $set: { liberacion: null } });
  console.log(`✅ Aplicado. Fechas de liberación borradas: ${r.modifiedCount}`);
} else {
  console.log("(simulación: agregá --aplicar para guardarlo)");
}
await mongoose.disconnect();
