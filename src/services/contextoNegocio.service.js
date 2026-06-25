import {
  VentasModel,
  ProductoModel,
  TareasModel,
  ContenidoModel,
} from "../dao/models/index.js";

const diasAtras = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

const fmtMoneda = (n) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

/**
 * Construye un resumen compacto del negocio (datos reales) para inyectar como
 * contexto en el prompt del asistente. Tolerante a fallos: si una consulta
 * falla, se omite esa línea.
 */
export const buildBusinessContext = async () => {
  const now = new Date();
  const lines = [];

  const safe = (p, fallback) => p.catch(() => fallback);

  try {
    const [
      totalProductos,
      tareasPend,
      ventas30,
      pendienteCobro,
      vencidas,
      contenidoProg,
    ] = await Promise.all([
      safe(ProductoModel.countDocuments(), null),
      safe(TareasModel.countDocuments({ status: { $ne: "hecho" } }), null),
      safe(
        VentasModel.aggregate([
          { $match: { fecha: { $gte: diasAtras(30) } } },
          { $group: { _id: null, total: { $sum: "$valorTotal" }, count: { $sum: 1 } } },
        ]),
        []
      ),
      safe(
        VentasModel.aggregate([
          { $match: { restan: { $gt: 0 } } },
          { $group: { _id: null, total: { $sum: "$restan" }, count: { $sum: 1 } } },
        ]),
        []
      ),
      safe(
        VentasModel.countDocuments({
          estado: { $ne: "despachada" },
          fechaLimite: { $lt: now, $ne: null },
        }),
        null
      ),
      safe(
        ContenidoModel.countDocuments({
          fechaPublicacion: { $ne: null },
          estado: { $ne: "publicado" },
        }),
        null
      ),
    ]);

    if (totalProductos != null) lines.push(`- Productos en catálogo: ${totalProductos}`);
    if (ventas30?.[0]) {
      lines.push(
        `- Facturación últimos 30 días: ${fmtMoneda(ventas30[0].total)} (${ventas30[0].count} ventas)`
      );
    }
    if (pendienteCobro?.[0]) {
      lines.push(
        `- Saldo pendiente de cobro: ${fmtMoneda(pendienteCobro[0].total)} en ${pendienteCobro[0].count} ventas`
      );
    }
    if (vencidas != null) lines.push(`- Entregas vencidas sin despachar: ${vencidas}`);
    if (tareasPend != null) lines.push(`- Tareas pendientes: ${tareasPend}`);
    if (contenidoProg != null) lines.push(`- Publicaciones programadas: ${contenidoProg}`);
  } catch {
    // degradado: devolvemos lo que se haya juntado
  }

  if (!lines.length) return "No hay datos de negocio disponibles en este momento.";
  return lines.join("\n");
};

/**
 * Resumen proactivo para el saludo inicial del asistente. Es determinístico
 * (NO usa la IA, así no consume cuota) y resalta lo accionable del día.
 */
export const buildResumenProactivo = async () => {
  const now = new Date();
  const finHoy = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const safe = (p, fallback) => p.catch(() => fallback);

  const [vencidas, entregasHoy, cobro, tareasVencen] = await Promise.all([
    safe(
      VentasModel.countDocuments({ estado: { $ne: "despachada" }, fechaLimite: { $lt: now, $ne: null } }),
      0
    ),
    safe(
      VentasModel.countDocuments({
        estado: { $ne: "despachada" },
        fechaLimite: { $gte: now, $lte: finHoy },
      }),
      0
    ),
    safe(
      VentasModel.aggregate([
        { $match: { restan: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: "$restan" }, count: { $sum: 1 } } },
      ]),
      []
    ),
    safe(
      TareasModel.countDocuments({ status: { $ne: "hecho" }, dueDate: { $ne: null, $lte: finHoy } }),
      0
    ),
  ]);

  const puntos = [];
  if (vencidas) puntos.push(`🔴 ${vencidas} entrega${vencidas > 1 ? "s" : ""} **vencida${vencidas > 1 ? "s" : ""}**`);
  if (entregasHoy) puntos.push(`🚚 ${entregasHoy} entrega${entregasHoy > 1 ? "s" : ""} para **hoy**`);
  if (cobro?.[0]?.count) {
    puntos.push(`💰 ${fmtMoneda(cobro[0].total)} pendiente de cobro (${cobro[0].count} venta${cobro[0].count > 1 ? "s" : ""})`);
  }
  if (tareasVencen) puntos.push(`📋 ${tareasVencen} tarea${tareasVencen > 1 ? "s" : ""} que vence${tareasVencen > 1 ? "n" : ""} hoy o antes`);

  if (!puntos.length) {
    return "👋 ¡Hola! No tenés pendientes urgentes hoy. ¿En qué te ayudo?";
  }
  return `👋 ¡Hola! Esto es lo que requiere tu atención:\n\n${puntos.map((p) => `- ${p}`).join("\n")}`;
};
