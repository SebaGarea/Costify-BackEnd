import {
  VentasModel,
  ProductoModel,
  TareasModel,
  ContenidoModel,
} from "../dao/models/index.js";

const CANALES_VALIDOS = ["instagram", "facebook", "tiktok", "tiendanube"];
const TIPOS_VALIDOS = ["foto", "reel", "carrusel", "historia", "otro"];
const PRIORIDADES = ["alta", "media", "baja"];
const aFecha = (s) => (s ? new Date(`${String(s).slice(0, 10)}T12:00:00.000Z`) : null);

const diasAtras = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

const fetchJson = async (url, ms = 6000) => {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    return await res.json();
  } finally {
    clearTimeout(t);
  }
};

// ---------- Declaraciones (formato Gemini) ----------
export const toolDeclarations = [
  {
    name: "getMetricasNegocio",
    description:
      "Métricas de ventas del negocio en un período: facturación total, cantidad de ventas, ticket promedio, saldo pendiente de cobro y entregas vencidas.",
    parameters: {
      type: "OBJECT",
      properties: {
        dias: { type: "NUMBER", description: "Cantidad de días hacia atrás. Default 30." },
      },
    },
  },
  {
    name: "getEntregasProximas",
    description:
      "Lista de ventas no despachadas: las vencidas y las que vencen dentro de N días. Útil para saber qué hay que entregar.",
    parameters: {
      type: "OBJECT",
      properties: {
        dias: { type: "NUMBER", description: "Ventana de próximos días. Default 7." },
      },
    },
  },
  {
    name: "buscarProducto",
    description:
      "Busca productos del catálogo por nombre o modelo y devuelve precio de venta, costo y precio de la planilla, y stock.",
    parameters: {
      type: "OBJECT",
      properties: {
        texto: { type: "STRING", description: "Nombre o parte del nombre/modelo del producto." },
      },
      required: ["texto"],
    },
  },
  {
    name: "getClima",
    description: "Clima actual de una ciudad: temperatura, sensación térmica, viento y estado.",
    parameters: {
      type: "OBJECT",
      properties: {
        ciudad: { type: "STRING", description: "Nombre de la ciudad. Ej: 'Buenos Aires'." },
      },
      required: ["ciudad"],
    },
  },
  {
    name: "getDolar",
    description: "Cotización actual del dólar en Argentina (oficial y blue), compra y venta.",
    parameters: { type: "OBJECT", properties: {} },
  },
  {
    name: "crearTarea",
    description:
      "Crea una tarea / recordatorio en la app. Usalo cuando el usuario pida agendar, recordar o anotar algo para hacer.",
    parameters: {
      type: "OBJECT",
      properties: {
        titulo: { type: "STRING", description: "Qué hay que hacer." },
        prioridad: { type: "STRING", description: "alta, media o baja." },
        fecha: { type: "STRING", description: "Fecha de vencimiento YYYY-MM-DD (opcional)." },
        notas: { type: "STRING", description: "Detalles adicionales (opcional)." },
      },
      required: ["titulo"],
    },
  },
  {
    name: "crearPublicacion",
    description:
      "Crea una publicación de contenido (idea) en la sección Contenido, con el copy ya escrito. Usalo cuando el usuario pida armar/cargar un posteo o generar un texto para publicar. Vos escribís el copy.",
    parameters: {
      type: "OBJECT",
      properties: {
        titulo: { type: "STRING", description: "Título / idea de la publicación." },
        copy: { type: "STRING", description: "Texto del posteo (caption + hashtags)." },
        canales: {
          type: "ARRAY",
          items: { type: "STRING" },
          description: "Canales: instagram, facebook, tiktok, tiendanube.",
        },
        tipo: { type: "STRING", description: "foto, reel, carrusel, historia." },
        productoTexto: { type: "STRING", description: "Nombre del producto asociado (opcional)." },
        fecha: { type: "STRING", description: "Fecha de publicación YYYY-MM-DD (opcional)." },
      },
      required: ["titulo", "copy"],
    },
  },
];

// ---------- Implementaciones ----------
const getMetricasNegocio = async ({ dias } = {}) => {
  const n = Number.isFinite(Number(dias)) && Number(dias) > 0 ? Number(dias) : 30;
  const [agg, pend, vencidas] = await Promise.all([
    VentasModel.aggregate([
      { $match: { fecha: { $gte: diasAtras(n) } } },
      { $group: { _id: null, total: { $sum: "$valorTotal" }, count: { $sum: 1 } } },
    ]),
    VentasModel.aggregate([
      { $match: { restan: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: "$restan" }, count: { $sum: 1 } } },
    ]),
    VentasModel.countDocuments({ estado: { $ne: "despachada" }, fechaLimite: { $lt: new Date(), $ne: null } }),
  ]);
  const a = agg[0] || {};
  const p = pend[0] || {};
  return {
    periodoDias: n,
    facturacion: a.total || 0,
    cantidadVentas: a.count || 0,
    ticketPromedio: a.count ? Math.round((a.total || 0) / a.count) : 0,
    saldoPendiente: p.total || 0,
    ventasConSaldo: p.count || 0,
    entregasVencidas: vencidas || 0,
    moneda: "ARS",
  };
};

const getEntregasProximas = async ({ dias } = {}) => {
  const n = Number.isFinite(Number(dias)) && Number(dias) > 0 ? Number(dias) : 7;
  const now = new Date();
  const hasta = new Date(now.getTime() + n * 24 * 60 * 60 * 1000);
  const docs = await VentasModel.find({
    estado: { $ne: "despachada" },
    fechaLimite: { $ne: null, $lte: hasta },
  })
    .sort({ fechaLimite: 1 })
    .limit(30)
    .lean();
  return {
    items: docs.map((d) => ({
      producto: d.productoNombre || "Producto",
      cliente: typeof d.cliente === "string" ? d.cliente : d.cliente?.nombre || "",
      fechaLimite: d.fechaLimite,
      vencida: new Date(d.fechaLimite) < now,
    })),
  };
};

const buscarProducto = async ({ texto } = {}) => {
  if (!texto) return { error: "Falta el texto de búsqueda" };
  const rx = new RegExp(texto.trim(), "i");
  const docs = await ProductoModel.find({ $or: [{ nombre: rx }, { modelo: rx }] })
    .limit(5)
    .populate("planillaCosto", "nombre precioFinal costoTotal")
    .lean();
  return {
    items: docs.map((d) => ({
      nombre: `${d.nombre || ""} ${d.modelo || ""}`.trim(),
      precioVenta: d.precio,
      stock: d.stock,
      costoPlanilla: d.planillaCosto?.costoTotal ?? null,
      precioPlanilla: d.planillaCosto?.precioFinal ?? null,
    })),
  };
};

const WMO = {
  0: "Despejado",
  1: "Mayormente despejado",
  2: "Parcialmente nublado",
  3: "Nublado",
  45: "Niebla",
  48: "Niebla con escarcha",
  51: "Llovizna leve",
  53: "Llovizna",
  55: "Llovizna intensa",
  61: "Lluvia leve",
  63: "Lluvia",
  65: "Lluvia fuerte",
  71: "Nieve leve",
  73: "Nieve",
  75: "Nieve fuerte",
  80: "Chubascos",
  81: "Chubascos fuertes",
  82: "Chubascos violentos",
  95: "Tormenta",
  96: "Tormenta con granizo",
  99: "Tormenta fuerte con granizo",
};

const getClima = async ({ ciudad } = {}) => {
  if (!ciudad) return { error: "Falta la ciudad" };
  const geo = await fetchJson(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(ciudad)}&count=1&language=es&format=json`
  );
  const loc = geo?.results?.[0];
  if (!loc) return { error: `No encontré la ciudad "${ciudad}"` };
  const f = await fetchJson(
    `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m`
  );
  const c = f?.current || {};
  return {
    ciudad: `${loc.name}${loc.admin1 ? ", " + loc.admin1 : ""}${loc.country ? ", " + loc.country : ""}`,
    temperaturaC: c.temperature_2m ?? null,
    sensacionC: c.apparent_temperature ?? null,
    vientoKmh: c.wind_speed_10m ?? null,
    estado: WMO[c.weather_code] ?? "Desconocido",
  };
};

const getDolar = async () => {
  const data = await fetchJson("https://dolarapi.com/v1/dolares");
  if (!Array.isArray(data)) return { error: "No pude obtener la cotización" };
  const pick = (casa) => data.find((d) => d.casa === casa);
  const oficial = pick("oficial");
  const blue = pick("blue");
  return {
    oficial: oficial ? { compra: oficial.compra, venta: oficial.venta } : null,
    blue: blue ? { compra: blue.compra, venta: blue.venta } : null,
    fecha: oficial?.fechaActualizacion || blue?.fechaActualizacion || null,
  };
};

// ---------- Acciones (escritura) ----------
const crearTarea = async ({ titulo, prioridad, fecha, notas } = {}, ctx = {}) => {
  if (!ctx.userId) return { error: "No se pudo identificar al usuario" };
  if (!titulo) return { error: "Falta el título de la tarea" };
  const tarea = await TareasModel.create({
    title: titulo,
    notes: notas || "",
    priority: PRIORIDADES.includes(prioridad) ? prioridad : "media",
    dueDate: aFecha(fecha),
    tags: [],
    createdBy: ctx.userId,
    updatedBy: ctx.userId,
  });
  return { ok: true, id: String(tarea._id), titulo: tarea.title, vence: tarea.dueDate };
};

const crearPublicacion = async ({ titulo, copy, canales, tipo, productoTexto, fecha } = {}, ctx = {}) => {
  if (!ctx.userId) return { error: "No se pudo identificar al usuario" };
  if (!titulo) return { error: "Falta el título de la publicación" };

  let producto = null;
  if (productoTexto) {
    const rx = new RegExp(productoTexto.trim(), "i");
    const p = await ProductoModel.findOne({ $or: [{ nombre: rx }, { modelo: rx }] }).lean();
    producto = p?._id || null;
  }

  const validCanales = (Array.isArray(canales) ? canales : []).filter((c) => CANALES_VALIDOS.includes(c));
  const pub = await ContenidoModel.create({
    titulo,
    copy: copy || "",
    canales: validCanales.length ? validCanales : ["instagram", "facebook"],
    tipo: TIPOS_VALIDOS.includes(tipo) ? tipo : "foto",
    fechaPublicacion: aFecha(fecha),
    producto,
    responsable: ctx.userId,
    estado: "idea",
    createdBy: ctx.userId,
    updatedBy: ctx.userId,
  });
  return {
    ok: true,
    id: String(pub._id),
    titulo: pub.titulo,
    programada: !!pub.fechaPublicacion,
    productoAsociado: Boolean(producto),
  };
};

// ---------- Dispatcher ----------
export const executeTool = async (name, args = {}, ctx = {}) => {
  switch (name) {
    case "getMetricasNegocio":
      return getMetricasNegocio(args);
    case "getEntregasProximas":
      return getEntregasProximas(args);
    case "buscarProducto":
      return buscarProducto(args);
    case "getClima":
      return getClima(args);
    case "getDolar":
      return getDolar();
    case "crearTarea":
      return crearTarea(args, ctx);
    case "crearPublicacion":
      return crearPublicacion(args, ctx);
    default:
      return { error: `Herramienta desconocida: ${name}` };
  }
};
