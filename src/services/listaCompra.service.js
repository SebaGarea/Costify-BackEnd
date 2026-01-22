import { ListaCompraDAOMongo } from "../dao/index.js";
import { buildDefaultSectionItems } from "../dao/models/index.js";

const SECTION_KEYS = ["herreria", "carpinteria", "pintura", "otros"];

const normalizeSectionItems = (value) => {
  const base = buildDefaultSectionItems();
  if (!value || typeof value !== "object") {
    return base;
  }

  const result = { ...base };
  Object.entries(value).forEach(([key, items]) => {
    if (Array.isArray(items)) {
      result[key] = items;
    } else if (!(key in result)) {
      result[key] = [];
    }
  });

  return result;
};

const parseAmount = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

class ListaCompraService {
  constructor(dao) {
    this.dao = dao;
  }

  async getListaCompra() {
    const doc = await this.dao.getOrCreate();
    return this.toResponse(doc);
  }

  async updateListaCompra(data = {}) {
    const payload = {
      sectionItems: normalizeSectionItems(data.sectionItems),
      efectivoDisponible: parseAmount(data.efectivoDisponible),
      dineroDigital: parseAmount(data.dineroDigital),
    };

    const updated = await this.dao.save(payload);
    return this.toResponse(updated);
  }

  toResponse(doc) {
    if (!doc) {
      return {
        sectionItems: buildDefaultSectionItems(),
        efectivoDisponible: 0,
        dineroDigital: 0,
        updatedAt: null,
      };
    }
    return {
      sectionItems: normalizeSectionItems(doc.sectionItems),
      efectivoDisponible: parseAmount(doc.efectivoDisponible),
      dineroDigital: parseAmount(doc.dineroDigital),
      updatedAt: doc.updatedAt ?? null,
    };
  }
}

export const listaCompraService = new ListaCompraService(ListaCompraDAOMongo);
export { ListaCompraService };
