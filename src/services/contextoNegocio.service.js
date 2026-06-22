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
