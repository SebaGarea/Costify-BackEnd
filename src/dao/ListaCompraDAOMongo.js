import { ListaCompraModel, buildDefaultSectionItems } from "./models/index.js";

const SINGLETON_KEY = "global";

export class ListaCompraDAOMongo {
  static async getOrCreate() {
    let doc = await ListaCompraModel.findOne({ key: SINGLETON_KEY }).lean();
    if (!doc) {
      const created = await ListaCompraModel.create({
        key: SINGLETON_KEY,
        sectionItems: buildDefaultSectionItems(),
      });
      doc = created.toObject();
    }
    return doc;
  }

  static async save(payload = {}) {
    const update = {};
    if (payload.sectionItems !== undefined) {
      update.sectionItems = payload.sectionItems;
    }
    if (payload.efectivoDisponible !== undefined) {
      update.efectivoDisponible = payload.efectivoDisponible;
    }
    if (payload.dineroDigital !== undefined) {
      update.dineroDigital = payload.dineroDigital;
    }

    const updated = await ListaCompraModel.findOneAndUpdate(
      { key: SINGLETON_KEY },
      { $set: update },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    return updated;
  }
}
