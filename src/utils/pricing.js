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

  const parseNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  for (const item of items) {
    const categoria = normalizeCategoryKey(item?.categoria).toLowerCase();
    const cantidad = Number(item?.cantidad ?? 0);
    if (!Number.isFinite(cantidad) || cantidad <= 0) continue;

    const materiaId = toStringId(item?.materiaPrima);
    const materia = materiaId ? materiaMap.get(materiaId) : null;
    const valorManual = Number(item?.valor ?? 0);
    const precioMateria = Number.isFinite(valorManual) && valorManual > 0
      ? valorManual
      : Number(materia?.precio ?? 0);
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
      categoriaNormalizada: categoria,
      gananciaIndividual: parseNumber(item?.gananciaIndividual),
    });
  }

  return { snapshots, subtotalesPorCategoria };
};

const getCategoriaPercentage = (categoria, porcentajes = {}) => {
  if (!categoria) return 0;
  const normalized = normalizeCategoryKey(categoria).toLowerCase();
  const candidates = [normalized, categoria, categoria?.toLowerCase?.(), categoria?.toUpperCase?.()]
    .filter(Boolean);

  for (const key of candidates) {
    if (key in porcentajes) {
      const parsed = Number(porcentajes[key]);
      return Number.isFinite(parsed) ? parsed : 0;
    }
  }
  return 0;
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
  const porcentajes = toPlainObject(planillaObj.porcentajesPorCategoria);

  // Sumar consumibles a subtotales para calcular costo de materiales
  for (const [categoria, valor] of Object.entries(consumibles)) {
    const amount = Number(valor);
    if (!Number.isFinite(amount) || amount <= 0) continue;
    const key = normalizeCategoryKey(categoria).toLowerCase();
    subtotalesPorCategoria[key] = (subtotalesPorCategoria[key] || 0) + amount;
  }

  const costoMateriales = Object.values(subtotalesPorCategoria).reduce(
    (sum, value) => sum + Number(value || 0),
    0
  );

  // Calcular precio con ganancia por item y consumible respetando gananciaIndividual
  let unitPrice = 0;
  for (const snapshot of snapshots) {
    const subtotal = Number(snapshot?.subtotal ?? 0);
    if (!Number.isFinite(subtotal) || subtotal <= 0) continue;

    const categoriaKey = snapshot?.categoriaNormalizada ?? snapshot?.categoria;
    const porcentajeCategoria = getCategoriaPercentage(categoriaKey, porcentajes);
    const porcentajeItem = snapshot?.gananciaIndividual;
    const porcentajeAplicado =
      porcentajeItem !== null && porcentajeItem !== undefined
        ? porcentajeItem
        : porcentajeCategoria;

    unitPrice += subtotal * (1 + porcentajeAplicado / 100);
  }

  for (const [categoria, valor] of Object.entries(consumibles)) {
    const amount = Number(valor);
    if (!Number.isFinite(amount) || amount <= 0) continue;
    const porcentaje = getCategoriaPercentage(categoria, porcentajes);
    unitPrice += amount * (1 + porcentaje / 100);
  }

  const extrasNormalizados = normalizeExtrasPayload(planillaObj.extras);
  const extrasTotal = calculateExtrasTotal(extrasNormalizados);

  const precioFinal = unitPrice + extrasTotal;
  const costoTotal = costoMateriales + extrasTotal;
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
