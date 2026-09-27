import { randomUUID } from "crypto";
import { ListaCompraDAOMongo, PlantillaCostoDAOMongo } from "../dao/index.js";
import { buildDefaultSectionItems, MateriaPrimaModel } from "../dao/models/index.js";

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

// En la lista de compras siempre se compran unidades enteras: 1.5 → 2, 0.87 → 1.
// Se redondea a 4 decimales antes del ceil para que errores de coma flotante
// (ej. 2.0000000001) no sumen una unidad de más.
export const redondearCantidadCompra = (value) => {
  const parsed = Number(String(value ?? "").replace(",", "."));
  if (!Number.isFinite(parsed) || parsed <= 0) return 1;
  return Math.max(1, Math.ceil(Math.round(parsed * 10000) / 10000));
};

const toIdString = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value._id) return value._id.toString();
  return value.toString();
};

const getMaterialDisplayName = (material) =>
  material?.nombreMadera?.trim() ||
  material?.nombre?.trim() ||
  material?.codigo?.trim() ||
  "";

const esDePlantilla = (item, plantillaId, uid) =>
  item?.origen?.plantillaId === plantillaId &&
  (uid === undefined || item?.origen?.itemUid === uid);

// Campos de la materia prima que usa la lista de compras para mostrar y
// cotizar el ítem. El precio NO se copia: la lista lo toma en vivo de la MP.
const camposDeMateria = (material) => ({
  categoria: material?.categoria || "",
  tipo: material?.type || "",
  medida: material?.medida || "",
  espesor: material?.espesor || "",
  materiaId: toIdString(material?._id),
  nombreMadera: getMaterialDisplayName(material),
  precioOverride: null,
  esPersonalizado: false,
  nombrePersonalizado: "",
  valorPersonalizado: 0,
});

const camposPersonalizados = ({ descripcion, valor }) => ({
  categoria: "",
  tipo: "",
  medida: "",
  espesor: "",
  materiaId: "",
  nombreMadera: "",
  precioOverride: null,
  esPersonalizado: true,
  nombrePersonalizado: descripcion || "Ítem manual",
  valorPersonalizado: parseAmount(valor),
});

const describirItemPersonalizado = (item) =>
  item?.descripcionPersonalizada?.trim() ||
  [item?.categoriaMP, item?.tipoMP, item?.nombreMadera, item?.medidaMP, item?.espesorMP]
    .filter(Boolean)
    .join(" - ");

const crearError = (message, status) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

class ListaCompraService {
  constructor(dao) {
    this.dao = dao;
    // La lista es un único documento que se reescribe entero; serializamos las
    // modificaciones para que dos cambios simultáneos no se pisen entre sí.
    this.cola = Promise.resolve();
  }

  enCola(tarea) {
    const resultado = this.cola.then(tarea, tarea);
    this.cola = resultado.catch(() => {});
    return resultado;
  }

  async getListaCompra() {
    const doc = await this.dao.getOrCreate();
    return this.toResponse(doc);
  }

  async updateListaCompra(data = {}) {
    return this.enCola(async () => {
      const payload = {
        sectionItems: normalizeSectionItems(data.sectionItems),
        efectivoDisponible: parseAmount(data.efectivoDisponible),
        dineroDigital: parseAmount(data.dineroDigital),
      };

      const updated = await this.dao.save(payload);
      return this.toResponse(updated);
    });
  }

  // Aplica `transformar` sobre los ítems de la lista y guarda solo si hubo cambios.
  async modificarItems(transformar) {
    return this.enCola(async () => {
      const doc = await this.dao.getOrCreate();
      const actuales = normalizeSectionItems(doc.sectionItems);
      const { sectionItems, changed } = await transformar(actuales);
      if (!changed) return this.toResponse(doc);
      const updated = await this.dao.saveSectionItems(sectionItems);
      return this.toResponse(updated);
    });
  }

  // Agrega (o actualiza, si ya estaba) un ítem de una planilla a la lista.
  async vincularItemPlantilla({ plantillaId, uid, seccion, cantidad, materiaPrimaId, esPersonalizado, descripcion, valor } = {}) {
    if (!plantillaId || !uid) {
      throw crearError("Faltan datos del ítem de la planilla", 400);
    }
    if (!SECTION_KEYS.includes(seccion)) {
      throw crearError("Sección inválida", 400);
    }

    const plantilla = await PlantillaCostoDAOMongo.getById(plantillaId);
    if (!plantilla) {
      throw crearError("Planilla no encontrada", 404);
    }

    let campos;
    if (esPersonalizado) {
      campos = camposPersonalizados({ descripcion, valor });
    } else {
      const material = materiaPrimaId
        ? await MateriaPrimaModel.findById(materiaPrimaId).lean().catch(() => null)
        : null;
      if (!material) {
        throw crearError("La materia prima del ítem no existe en la base de datos", 400);
      }
      campos = camposDeMateria(material);
    }

    const cantidadCompra = redondearCantidadCompra(cantidad);
    const plantillaNombre = plantilla.nombre || "";

    return this.modificarItems(async (sectionItems) => {
      const next = { ...sectionItems };
      // Si el ítem ya estaba vinculado (en cualquier sección) se reemplaza.
      let previo = null;
      Object.keys(next).forEach((key) => {
        const lista = Array.isArray(next[key]) ? next[key] : [];
        const encontrado = lista.find((it) => esDePlantilla(it, plantillaId, uid));
        if (encontrado) {
          previo = encontrado;
          next[key] = lista.filter((it) => !esDePlantilla(it, plantillaId, uid));
        }
      });

      const item = {
        id: previo?.id || `plantilla-${randomUUID()}`,
        ...campos,
        cantidad: cantidadCompra,
        descripcion: "",
        detalle: previo?.detalle || plantillaNombre,
        origen: {
          tipo: "plantilla",
          plantillaId,
          plantillaNombre,
          itemUid: uid,
          cantidadSincronizada: cantidadCompra,
        },
      };

      next[seccion] = [...(next[seccion] || []), item];
      return { sectionItems: next, changed: true };
    });
  }

  async desvincularItemPlantilla(plantillaId, uid) {
    return this.modificarItems(async (sectionItems) => {
      let changed = false;
      const next = {};
      Object.entries(sectionItems).forEach(([key, lista]) => {
        const filtrada = lista.filter((it) => !esDePlantilla(it, plantillaId, uid));
        if (filtrada.length !== lista.length) changed = true;
        next[key] = filtrada;
      });
      return { sectionItems: next, changed };
    });
  }

  // Tras guardar una planilla, mantiene sus ítems vinculados al día:
  // - si el ítem ya no existe en la planilla, se quita de la lista;
  // - si cambió la cantidad en la planilla, se actualiza (redondeada);
  //   si no cambió, se respeta lo que se haya editado a mano en la lista;
  // - si cambió la materia prima, se actualizan sus datos;
  // - se actualiza el nombre de la planilla en el detalle.
  async sincronizarPlantilla(plantilla) {
    const plantillaId = toIdString(plantilla?._id);
    if (!plantillaId) return null;

    const itemsPorUid = new Map(
      (Array.isArray(plantilla.items) ? plantilla.items : [])
        .filter((it) => it?.uid)
        .map((it) => [it.uid, it])
    );
    const plantillaNombre = plantilla.nombre || "";

    return this.modificarItems(async (sectionItems) => {
      const vinculados = Object.values(sectionItems)
        .flat()
        .filter((it) => esDePlantilla(it, plantillaId));
      if (!vinculados.length) return { sectionItems, changed: false };

      const materiaIds = [...new Set(
        vinculados
          .map((it) => itemsPorUid.get(it.origen.itemUid))
          .filter((it) => it && !it.esPersonalizado)
          .map((it) => toIdString(it.materiaPrima))
          .filter(Boolean)
      )];
      const materiales = materiaIds.length
        ? await MateriaPrimaModel.find({ _id: { $in: materiaIds } }).lean()
        : [];
      const materialesPorId = new Map(materiales.map((m) => [m._id.toString(), m]));

      let changed = false;
      const next = {};
      Object.entries(sectionItems).forEach(([key, lista]) => {
        next[key] = lista.flatMap((entrada) => {
          if (!esDePlantilla(entrada, plantillaId)) return [entrada];

          const itemPlantilla = itemsPorUid.get(entrada.origen.itemUid);
          if (!itemPlantilla) {
            changed = true;
            return [];
          }

          let actualizado = entrada;
          const actualizar = (campos) => {
            actualizado = { ...actualizado, ...campos };
            changed = true;
          };

          const cantidadCompra = redondearCantidadCompra(itemPlantilla.cantidad);
          if (cantidadCompra !== entrada.origen.cantidadSincronizada) {
            actualizar({
              cantidad: cantidadCompra,
              origen: { ...actualizado.origen, cantidadSincronizada: cantidadCompra },
            });
          }

          if (itemPlantilla.esPersonalizado) {
            const descripcion = describirItemPersonalizado(itemPlantilla);
            const valor = parseAmount(itemPlantilla.valor);
            if (
              !entrada.esPersonalizado ||
              entrada.nombrePersonalizado !== descripcion ||
              parseAmount(entrada.valorPersonalizado) !== valor
            ) {
              actualizar(camposPersonalizados({ descripcion, valor }));
            }
          } else {
            const material = materialesPorId.get(toIdString(itemPlantilla.materiaPrima));
            if (material && (entrada.esPersonalizado || entrada.materiaId !== material._id.toString())) {
              actualizar(camposDeMateria(material));
            }
          }

          if (entrada.origen.plantillaNombre !== plantillaNombre) {
            const detalleEraElNombre = !entrada.detalle || entrada.detalle === entrada.origen.plantillaNombre;
            actualizar({
              ...(detalleEraElNombre ? { detalle: plantillaNombre } : {}),
              origen: { ...actualizado.origen, plantillaNombre },
            });
          }

          return [actualizado];
        });
      });

      return { sectionItems: next, changed };
    });
  }

  // Al borrar una planilla, sus ítems quedan en la lista (pueden seguir
  // haciendo falta) pero dejan de estar vinculados.
  async desvincularPlantilla(plantillaId) {
    const id = toIdString(plantillaId);
    if (!id) return null;
    return this.modificarItems(async (sectionItems) => {
      let changed = false;
      const next = {};
      Object.entries(sectionItems).forEach(([key, lista]) => {
        next[key] = lista.map((it) => {
          if (!esDePlantilla(it, id)) return it;
          changed = true;
          const { origen, ...resto } = it;
          return resto;
        });
      });
      return { sectionItems: next, changed };
    });
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
