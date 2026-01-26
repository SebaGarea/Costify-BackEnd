import { MateriaPrimaModel } from "../dao/models/MateriaPrimaSchema.js";
import { normalizeExtrasPayload, calculateExtrasTotal } from "./planillaExtras.js";

const toPlainObject = (value) => {
  if (!value) return {};
  if (value instanceof Map) return Object.fromEntries(value);
  if (typeof value.toObject === "function") return value.toObject();
  if (typeof value === "object") return { ...value };
  return {};
};

const normalizeCategoryKey = (value) => {
  const raw = (value ?? "general").toString().trim();
  return raw || "general";
};

const toStringId = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null) {
    if (value._id) return value._id.toString();
    if (typeof value.toString === "function") return value.toString();
  }
  return String(value);
};

export const buildPlanillaSnapshotData = async (planilla) => {
  if (!planilla) {
    return { snapshots: [], subtotalesPorCategoria: {} };
  }

  const planillaObj =
    typeof planilla.toObject === "function" ? planilla.toObject() : planilla;
  const items = Array.isArray(planillaObj.items) ? planillaObj.items : [];
  if (items.length === 0) {
    return { snapshots: [], subtotalesPorCategoria: {} };
  }

  const materiaIds = items
    .map((item) => toStringId(item?.materiaPrima))
    .filter(Boolean);

  let materiaMap = new Map();
  if (materiaIds.length > 0) {
    const uniqueIds = [...new Set(materiaIds)];
    const materias = await MateriaPrimaModel.find({ _id: { $in: uniqueIds } }).lean();
    materiaMap = new Map(materias.map((mp) => [mp._id.toString(), mp]));
  }

  const snapshots = [];
  const subtotalesPorCategoria = {};

  for (const item of items) {
    const categoria = normalizeCategoryKey(item?.categoria).toLowerCase();
    const cantidad = Number(item?.cantidad ?? 0);
    if (!Number.isFinite(cantidad) || cantidad <= 0) continue;

    const materiaId = toStringId(item?.materiaPrima);
    const materia = materiaId ? materiaMap.get(materiaId) : null;
    const precioMateria = Number(materia?.precio ?? item?.valor ?? 0);
    const subtotal = precioMateria * cantidad;

    if (subtotal <= 0) {
      continue;
    }

    subtotalesPorCategoria[categoria] =
      (subtotalesPorCategoria[categoria] || 0) + subtotal;

    snapshots.push({
      materiaPrima: materia?._id ?? item?.materiaPrima ?? null,
      nombre: materia?.nombre ?? item?.descripcionPersonalizada ?? "",
      categoria: materia?.categoria ?? item?.categoria ?? categoria,
      type: materia?.type ?? "",
      medida: materia?.medida ?? "",
      espesor: materia?.espesor ?? "",
      precio: precioMateria,
      cantidadUtilizada: cantidad,
      subtotal,
      actualizadoEn: materia?.updatedAt ?? null,
    });
  }

  return { snapshots, subtotalesPorCategoria };
};

export const computePlanillaPricing = async (planilla) => {
  if (!planilla) {
    return { unitPrice: 0, snapshots: [], subtotalesPorCategoria: {} };
  }

  const planillaObj =
    typeof planilla.toObject === "function" ? planilla.toObject() : planilla;
  const { snapshots, subtotalesPorCategoria } = await buildPlanillaSnapshotData(
    planillaObj
  );

  const consumibles = toPlainObject(planillaObj.consumibles);
  for (const [categoria, valor] of Object.entries(consumibles)) {
    const amount = Number(valor);
    if (!Number.isFinite(amount) || amount <= 0) continue;
    const key = normalizeCategoryKey(categoria).toLowerCase();
    subtotalesPorCategoria[key] =
      (subtotalesPorCategoria[key] || 0) + amount;
  }

  const porcentajes = toPlainObject(planillaObj.porcentajesPorCategoria);
  const costoMateriales = Object.values(subtotalesPorCategoria).reduce(
    (sum, value) => sum + Number(value || 0),
    0
  );
  let unitPrice = 0;
  let unitPriceIncludesExtras = false;
  for (const [categoria, subtotal] of Object.entries(subtotalesPorCategoria)) {
    const pctKey = categoria in porcentajes ? categoria : categoria.toLowerCase();
    const porcentaje = Number(porcentajes[pctKey] ?? 0);
    unitPrice += subtotal * (1 + porcentaje / 100);
  }

  if (!unitPrice && planillaObj.precioFinal) {
    unitPrice = Number(planillaObj.precioFinal);
    unitPriceIncludesExtras = true;
  }
  if (!unitPrice && planillaObj.costoTotal) {
    unitPrice = Number(planillaObj.costoTotal);
    unitPriceIncludesExtras = true;
  }

  const extrasNormalizados = normalizeExtrasPayload(planillaObj.extras);
  const extrasTotal = calculateExtrasTotal(extrasNormalizados);
  const costoTotal = costoMateriales + extrasTotal;
  const precioFinal = unitPriceIncludesExtras
    ? unitPrice
    : unitPrice + extrasTotal;
  const ganancia = precioFinal - costoTotal;

  return {
    unitPrice,
    snapshots,
    subtotalesPorCategoria,
    costoMateriales,
    extrasTotal,
    costoTotal,
    precioFinal,
    ganancia,
  };
};
