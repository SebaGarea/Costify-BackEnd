import { ConfiguracionDAOMongo } from "../dao/ConfiguracionDAOMongo.js";

export const configuracionService = {
  get() {
    return ConfiguracionDAOMongo.get();
  },

  update(data) {
    return ConfiguracionDAOMongo.update(data);
  },

  async aplicarPrecioPinturaATodas(precio) {
    const result = await ConfiguracionDAOMongo.bulkUpdatePrecioPinturaPlantillas(precio);
    return { modificadas: result.modifiedCount };
  },
};
