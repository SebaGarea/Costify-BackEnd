import mongoose from "mongoose";
import { config } from "../src/config/config.js";
import { ListaCompraModel } from "../src/dao/models/ListaCompraSchema.js";

const FIELDS_TO_REMOVE = ["nombreManual", "nombreCliente"];

const cleanItems = (items = []) =>
  items.map((item) => {
    if (!item || typeof item !== "object") return item;
    const next = { ...item };
    FIELDS_TO_REMOVE.forEach((field) => {
      if (field in next) {
        delete next[field];
      }
    });
    return next;
  });

const cleanSectionItems = (sectionItems = {}) => {
  if (!sectionItems || typeof sectionItems !== "object") return sectionItems;
  const next = { ...sectionItems };
  Object.keys(next).forEach((key) => {
    const value = next[key];
    if (Array.isArray(value)) {
      next[key] = cleanItems(value);
    }
  });
  return next;
};

const run = async () => {
  if (!config.MONGO_URL) {
    console.error("MONGO_URL no está configurado");
    process.exit(1);
  }

  await mongoose.connect(config.MONGO_URL, { dbName: config.DB_NAME });

  const docs = await ListaCompraModel.find({}).lean();
  if (!docs.length) {
    console.log("No hay listas de compra para limpiar");
    await mongoose.disconnect();
    return;
  }

  let updatedCount = 0;

  for (const doc of docs) {
    const cleaned = cleanSectionItems(doc.sectionItems);
    const changed = JSON.stringify(cleaned) !== JSON.stringify(doc.sectionItems);
    if (changed) {
      await ListaCompraModel.updateOne({ _id: doc._id }, { $set: { sectionItems: cleaned } });
      updatedCount += 1;
    }
  }

  console.log(`Limpieza finalizada. Documentos actualizados: ${updatedCount}`);
  await mongoose.disconnect();
};

run().catch((error) => {
  console.error("Error al limpiar lista de compras", error);
  mongoose.disconnect().finally(() => process.exit(1));
});
