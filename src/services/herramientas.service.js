import {
  VentasModel,
  ProductoModel,
  TareasModel,
  ContenidoModel,
  MateriaPrimaModel,
} from "../dao/models/index.js";
import { webSearch } from "./ai.service.js";
import { ventasService } from "./ventas.service.js";
import { listaCompraService } from "./listaCompra.service.js";

const CANALES_VALIDOS = ["instagram", "facebook", "tiktok", "tiendanube"];
const TIPOS_VALIDOS = ["foto", "reel", "carrusel", "historia", "otro"];
const PRIORIDADES = ["alta", "media", "baja"];
const SECCIONES_COMPRA = ["herreria", "carpinteria", "pintura", "otros"];
const aFecha = (s) => (s ? new Date(`${String(s).slice(0, 10)}T12:00:00.000Z`) : null);

const diasAtras = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
const rx = (t) => new RegExp(String(t).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

// Entidades que cada herramienta de escritura afecta (para refrescar el front).
export const ENTIDAD_POR_TOOL = {
  crearTarea: "tarea",
  completarTarea: "tarea",
  editarTarea: "tarea",
  borrarTarea: "tarea",
  crearPublicacion: "contenido",
  registrarCobro: "venta",
  marcarDespachada: "venta",
  crearVenta: "venta",
  crearProducto: "producto",
  agregarListaCompra: "compra",
};

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
    name: "getMateriasBajoStock",
    description:
      "Lista las materias primas con stock bajo (por debajo o igual a un umbral). Útil para saber qué hay que reponer o comprar.",
    parameters: {
      type: "OBJECT",
      properties: {
        umbral: { type: "NUMBER", description: "Stock máximo para considerar 'bajo'. Default 5." },
      },
    },
  },
  {
    name: "getMargenProductos",
    description:
      "Productos ordenados por margen de ganancia (precio final menos costo de la planilla). Útil para saber qué conviene vender o empujar.",
    parameters: {
      type: "OBJECT",
      properties: {
        limite: { type: "NUMBER", description: "Cuántos productos devolver. Default 5." },
      },
    },
  },
  {
    name: "compararVentas",
    description:
      "Compara la facturación y cantidad de ventas del mes actual contra el mes anterior, con la variación porcentual.",
    parameters: { type: "OBJECT", properties: {} },
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
    name: "buscarWeb",
    description:
      "Busca información actual en internet (noticias, datos recientes, hechos del mundo, cualquier cosa que no esté en los datos del negocio ni en las otras herramientas).",
    parameters: {
      type: "OBJECT",
      properties: {
        consulta: { type: "STRING", description: "Qué buscar en la web." },
      },
      required: ["consulta"],
    },
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
    name: "completarTarea",
    description:
      "Marca una tarea existente como hecha. Buscá la tarea por su título o parte de él.",
    parameters: {
      type: "OBJECT",
      properties: {
        texto: { type: "STRING", description: "Título o parte del título de la tarea a completar." },
      },
      required: ["texto"],
    },
  },
  {
    name: "editarTarea",
    description:
      "Edita una tarea existente (cambiar fecha de vencimiento, prioridad, notas o título). Buscá la tarea por su título actual.",
    parameters: {
      type: "OBJECT",
      properties: {
        texto: { type: "STRING", description: "Título o parte del título de la tarea a editar." },
        titulo: { type: "STRING", description: "Nuevo título (opcional)." },
        fecha: { type: "STRING", description: "Nueva fecha de vencimiento YYYY-MM-DD (opcional)." },
        prioridad: { type: "STRING", description: "Nueva prioridad: alta, media o baja (opcional)." },
        notas: { type: "STRING", description: "Nuevas notas (opcional)." },
      },
      required: ["texto"],
    },
  },
  {
    name: "borrarTarea",
    description:
      "Elimina una tarea existente. ACCIÓN DESTRUCTIVA: confirmá con el usuario antes de usarla.",
    parameters: {
      type: "OBJECT",
      properties: {
        texto: { type: "STRING", description: "Título o parte del título de la tarea a eliminar." },
      },
      required: ["texto"],
    },
  },
  {
    name: "registrarCobro",
    description:
      "Registra un cobro (pago parcial o total) sobre una venta con saldo pendiente. Resta el monto al saldo. Buscá la venta por nombre del cliente.",
    parameters: {
      type: "OBJECT",
      properties: {
        cliente: { type: "STRING", description: "Nombre del cliente de la venta." },
        monto: { type: "NUMBER", description: "Monto cobrado." },
        producto: { type: "STRING", description: "Producto, para desambiguar si hay varias ventas (opcional)." },
      },
      required: ["cliente", "monto"],
    },
  },
  {
    name: "marcarDespachada",
    description:
      "Marca una venta como despachada/entregada (pone el saldo en 0). Buscá la venta por nombre del cliente.",
    parameters: {
      type: "OBJECT",
      properties: {
        cliente: { type: "STRING", description: "Nombre del cliente de la venta." },
        producto: { type: "STRING", description: "Producto, para desambiguar (opcional)." },
      },
      required: ["cliente"],
    },
  },
  {
    name: "crearVenta",
    description:
      "Registra una venta nueva. Si el producto está en el catálogo, usá productoTexto para tomar su precio; si no, indicá precio (precio unitario manual). ACCIÓN IMPORTANTE: confirmá los datos con el usuario antes de crearla.",
    parameters: {
      type: "OBJECT",
      properties: {
        cliente: { type: "STRING", description: "Nombre del cliente." },
        productoTexto: { type: "STRING", description: "Nombre del producto del catálogo (opcional)." },
        cantidad: { type: "NUMBER", description: "Cantidad. Default 1." },
        precio: { type: "NUMBER", description: "Precio unitario manual (si el producto NO está en catálogo)." },
        medio: { type: "STRING", description: "Medio de venta: instagram, mercado_libre, whatsapp, nube, otro." },
        seña: { type: "NUMBER", description: "Seña/adelanto cobrado (opcional)." },
        fechaLimite: { type: "STRING", description: "Fecha de entrega YYYY-MM-DD (opcional)." },
        descripcion: { type: "STRING", description: "Detalle de la venta (opcional)." },
      },
      required: ["cliente"],
    },
  },
  {
    name: "crearProducto",
    description:
      "Crea un producto en el catálogo. ACCIÓN IMPORTANTE: confirmá los datos con el usuario antes de crearlo.",
    parameters: {
      type: "OBJECT",
      properties: {
        nombre: { type: "STRING", description: "Nombre del producto." },
        catalogo: { type: "STRING", description: "Categoría/catálogo (ej: Muebles, Sillas)." },
        modelo: { type: "STRING", description: "Modelo del producto." },
        precio: { type: "NUMBER", description: "Precio de venta." },
        stock: { type: "NUMBER", description: "Stock inicial (opcional, default 0)." },
        descripcion: { type: "STRING", description: "Descripción (opcional)." },
      },
      required: ["nombre", "catalogo", "modelo", "precio"],
    },
  },
  {
    name: "agregarListaCompra",
    description:
      "Agrega un ítem a la lista de compras. Usalo cuando el usuario pida anotar algo para comprar.",
    parameters: {
      type: "OBJECT",
      properties: {
        texto: { type: "STRING", description: "Qué comprar." },
        cantidad: { type: "NUMBER", description: "Cantidad. Default 1." },
        seccion: { type: "STRING", description: "Sección: herreria, carpinteria, pintura u otros. Default otros." },
        precio: { type: "NUMBER", description: "Precio estimado unitario (opcional)." },
      },
      required: ["texto"],
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

// ---------- Lecturas / análisis ----------
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
  const r = rx(texto);
  const docs = await ProductoModel.find({ $or: [{ nombre: r }, { modelo: r }] })
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

const getMateriasBajoStock = async ({ umbral } = {}) => {
  const max = Number.isFinite(Number(umbral)) ? Number(umbral) : 5;
  const docs = await MateriaPrimaModel.find({ stock: { $lte: max } })
    .sort({ stock: 1 })
    .limit(30)
    .lean();
  return {
    umbral: max,
    items: docs.map((d) => ({
      nombre: d.nombre,
      categoria: d.categoria,
      stock: d.stock,
      unidad: d.unidad,
    })),
  };
};

const getMargenProductos = async ({ limite } = {}) => {
  const n = Number.isFinite(Number(limite)) && Number(limite) > 0 ? Number(limite) : 5;
  const docs = await ProductoModel.find({})
    .populate("planillaCosto", "precioFinal costoTotal")
    .lean();
  const items = docs
    .map((d) => {
      const precio = Number(d.planillaCosto?.precioFinal ?? d.precio ?? 0);
      const costo = Number(d.planillaCosto?.costoTotal ?? 0);
      const margen = precio - costo;
      return {
        nombre: `${d.nombre || ""} ${d.modelo || ""}`.trim(),
        precio,
        costo,
        margen,
        margenPct: precio > 0 ? Math.round((margen / precio) * 100) : null,
      };
    })
    .filter((x) => x.costo > 0)
    .sort((a, b) => b.margen - a.margen)
    .slice(0, n);
  return { items };
};

const compararVentas = async () => {
  const now = new Date();
  const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);
  const inicioMesPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const sumar = async (desde, hasta) => {
    const agg = await VentasModel.aggregate([
      { $match: { fecha: { $gte: desde, $lt: hasta } } },
      { $group: { _id: null, total: { $sum: "$valorTotal" }, count: { $sum: 1 } } },
    ]);
    return { total: agg[0]?.total || 0, count: agg[0]?.count || 0 };
  };
  const [actual, anterior] = await Promise.all([
    sumar(inicioMes, now),
    sumar(inicioMesPrev, inicioMes),
  ]);
  const variacionPct =
    anterior.total > 0
      ? Math.round(((actual.total - anterior.total) / anterior.total) * 100)
      : null;
  return { mesActual: actual, mesAnterior: anterior, variacionPct, moneda: "ARS" };
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

// ---------- Acciones: Tareas ----------
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

const findTarea = async (texto, soloPendientes = false) => {
  const filtro = { title: rx(texto) };
  if (soloPendientes) filtro.status = { $ne: "hecho" };
  return TareasModel.findOne(filtro).sort({ createdAt: -1 });
};

const completarTarea = async ({ texto } = {}, ctx = {}) => {
  if (!texto) return { error: "Falta indicar qué tarea completar" };
  const tarea = await findTarea(texto, true);
  if (!tarea) return { error: `No encontré una tarea pendiente que coincida con "${texto}"` };
  tarea.status = "hecho";
  tarea.updatedBy = ctx.userId;
  await tarea.save();
  return { ok: true, id: String(tarea._id), titulo: tarea.title };
};

const editarTarea = async ({ texto, titulo, fecha, prioridad, notas } = {}, ctx = {}) => {
  if (!texto) return { error: "Falta indicar qué tarea editar" };
  const tarea = await findTarea(texto);
  if (!tarea) return { error: `No encontré una tarea que coincida con "${texto}"` };
  if (typeof titulo === "string" && titulo.trim()) tarea.title = titulo.trim();
  if (typeof notas === "string") tarea.notes = notas;
  if (PRIORIDADES.includes(prioridad)) tarea.priority = prioridad;
  if (typeof fecha !== "undefined") tarea.dueDate = aFecha(fecha);
  tarea.updatedBy = ctx.userId;
  await tarea.save();
  return { ok: true, id: String(tarea._id), titulo: tarea.title, vence: tarea.dueDate };
};

const borrarTarea = async ({ texto } = {}) => {
  if (!texto) return { error: "Falta indicar qué tarea borrar" };
  const tarea = await findTarea(texto);
  if (!tarea) return { error: `No encontré una tarea que coincida con "${texto}"` };
  const titulo = tarea.title;
  await tarea.deleteOne();
  return { ok: true, titulo };
};

// ---------- Acciones: Ventas ----------
const findVentaPorCliente = async ({ cliente, producto, soloConSaldo = false, soloActivas = false }) => {
  const filtro = { cliente: rx(cliente) };
  if (producto) filtro.productoNombre = rx(producto);
  if (soloConSaldo) filtro.restan = { $gt: 0 };
  if (soloActivas) filtro.estado = { $nin: ["despachada", "cancelada"] };
  return VentasModel.findOne(filtro).sort({ fecha: -1 });
};

const registrarCobro = async ({ cliente, monto, producto } = {}, ctx = {}) => {
  if (!cliente) return { error: "Falta el cliente" };
  const m = Number(monto);
  if (!Number.isFinite(m) || m <= 0) return { error: "El monto debe ser mayor a cero" };
  const venta = await findVentaPorCliente({ cliente, producto, soloConSaldo: true });
  if (!venta) return { error: `No encontré una venta de "${cliente}" con saldo pendiente` };
  const cobrado = Math.min(m, venta.restan);
  venta.restan = Math.max(0, venta.restan - m);
  venta.seña = Number(venta.seña || 0) + cobrado;
  venta.updatedBy = ctx.userId;
  await venta.save();
  return {
    ok: true,
    cliente: venta.cliente,
    producto: venta.productoNombre || "",
    cobrado,
    saldoRestante: venta.restan,
  };
};

const marcarDespachada = async ({ cliente, producto } = {}, ctx = {}) => {
  if (!cliente) return { error: "Falta el cliente" };
  const venta = await findVentaPorCliente({ cliente, producto, soloActivas: true });
  if (!venta) return { error: `No encontré una venta activa de "${cliente}"` };
  venta.estado = "despachada";
  venta.restan = 0;
  venta.updatedBy = ctx.userId;
  await venta.save();
  return { ok: true, cliente: venta.cliente, producto: venta.productoNombre || "" };
};

const crearVenta = async (
  { cliente, productoTexto, cantidad, precio, medio, seña, fechaLimite, descripcion } = {},
  ctx = {}
) => {
  if (!cliente) return { error: "Falta el nombre del cliente" };

  let productoDoc = null;
  if (productoTexto) {
    productoDoc = await ProductoModel.findOne({
      $or: [{ nombre: rx(productoTexto) }, { modelo: rx(productoTexto) }],
    }).lean();
  }
  const cant = Number.isFinite(Number(cantidad)) && Number(cantidad) > 0 ? Number(cantidad) : 1;

  if (!productoDoc && !(Number(precio) > 0)) {
    return {
      error:
        "No encontré el producto en el catálogo. Indicá un precio unitario (precio) para registrar la venta manual.",
    };
  }

  try {
    const venta = await ventasService.createVenta(
      {
        cliente,
        medio: medio || "otro",
        productoId: productoDoc?._id || null,
        productoNombre: productoDoc ? `${productoDoc.nombre || ""} ${productoDoc.modelo || ""}`.trim() : productoTexto || "",
        cantidad: cant,
        precioManual: productoDoc ? null : Number(precio),
        seña: Number(seña) > 0 ? Number(seña) : 0,
        fechaLimite: aFecha(fechaLimite),
        descripcion: descripcion || "",
      },
      ctx.userId
    );
    return {
      ok: true,
      id: String(venta._id),
      cliente: venta.cliente,
      producto: venta.productoNombre || "",
      total: venta.valorTotal,
      saldo: venta.restan,
    };
  } catch (err) {
    return { error: err.message };
  }
};

// ---------- Acciones: Productos ----------
const crearProducto = async ({ nombre, catalogo, modelo, precio, stock, descripcion } = {}) => {
  if (!nombre || !catalogo || !modelo) return { error: "Faltan datos: nombre, catálogo y modelo son obligatorios" };
  if (!(Number(precio) > 0)) return { error: "El precio debe ser mayor a cero" };
  try {
    const prod = await ProductoModel.create({
      nombre,
      catalogo,
      modelo,
      precio: Number(precio),
      stock: Number.isFinite(Number(stock)) ? Number(stock) : 0,
      descripcion: descripcion || "",
    });
    return { ok: true, id: String(prod._id), nombre: prod.nombre, precio: prod.precio };
  } catch (err) {
    return { error: err.message };
  }
};

// ---------- Acciones: Lista de compras ----------
const agregarListaCompra = async ({ texto, cantidad, seccion, precio } = {}) => {
  if (!texto) return { error: "Falta indicar qué comprar" };
  const sec = SECCIONES_COMPRA.includes(seccion) ? seccion : "otros";
  const lista = await listaCompraService.getListaCompra();
  const item = {
    id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    categoria: "",
    tipo: "",
    medida: "",
    espesor: "",
    materiaId: "",
    nombreMadera: "",
    cantidad: String(Number.isFinite(Number(cantidad)) && Number(cantidad) > 0 ? Number(cantidad) : 1),
    descripcion: "",
    detalle: "",
    precioOverride: null,
    esPersonalizado: true,
    nombrePersonalizado: texto,
    valorPersonalizado: Number(precio) > 0 ? Number(precio) : 0,
  };
  const sectionItems = { ...lista.sectionItems };
  sectionItems[sec] = [...(sectionItems[sec] || []), item];
  await listaCompraService.updateListaCompra({
    sectionItems,
    efectivoDisponible: lista.efectivoDisponible,
    dineroDigital: lista.dineroDigital,
  });
  return { ok: true, item: texto, seccion: sec, cantidad: item.cantidad };
};

// ---------- Acciones: Contenido ----------
const crearPublicacion = async ({ titulo, copy, canales, tipo, productoTexto, fecha } = {}, ctx = {}) => {
  if (!ctx.userId) return { error: "No se pudo identificar al usuario" };
  if (!titulo) return { error: "Falta el título de la publicación" };

  let producto = null;
  if (productoTexto) {
    const p = await ProductoModel.findOne({ $or: [{ nombre: rx(productoTexto) }, { modelo: rx(productoTexto) }] }).lean();
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
    case "getMateriasBajoStock":
      return getMateriasBajoStock(args);
    case "getMargenProductos":
      return getMargenProductos(args);
    case "compararVentas":
      return compararVentas();
    case "getClima":
      return getClima(args);
    case "getDolar":
      return getDolar();
    case "buscarWeb":
      return { resultado: await webSearch(args.consulta || "") };
    case "crearTarea":
      return crearTarea(args, ctx);
    case "completarTarea":
      return completarTarea(args, ctx);
    case "editarTarea":
      return editarTarea(args, ctx);
    case "borrarTarea":
      return borrarTarea(args, ctx);
    case "registrarCobro":
      return registrarCobro(args, ctx);
    case "marcarDespachada":
      return marcarDespachada(args, ctx);
    case "crearVenta":
      return crearVenta(args, ctx);
    case "crearProducto":
      return crearProducto(args, ctx);
    case "agregarListaCompra":
      return agregarListaCompra(args);
    case "crearPublicacion":
      return crearPublicacion(args, ctx);
    default:
      return { error: `Herramienta desconocida: ${name}` };
  }
};
