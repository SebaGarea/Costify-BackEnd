import { ConfiguracionModel } from "./models/ConfiguracionSchema.js";
import { PlantillaCostoModel } from "./models/index.js";

export class ConfiguracionDAOMongo {
  static async get() {
    const doc = await ConfiguracionModel.findOne().lean();
    return doc ?? { precioPinturaM2: 15000 };
  }

  static async update(data) {
    return ConfiguracionModel.findOneAndUpdate({}, data, { new: true, upsert: true }).lean();
  }

  static async bulkUpdatePrecioPinturaPlantillas(precio) {
    return PlantillaCostoModel.updateMany({}, { $set: { precioPinturaM2: precio } });
  }
}
