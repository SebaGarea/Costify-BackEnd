import { streamChat } from "../services/ai.service.js";
import { buildBusinessContext, buildResumenProactivo } from "../services/contextoNegocio.service.js";
import { toolDeclarations, executeTool, ENTIDAD_POR_TOOL } from "../services/herramientas.service.js";
import { configuracionService } from "../services/configuracion.service.js";
import { ChatMessageModel } from "../dao/models/index.js";
import logger from "../config/logger.js";

const HISTORIAL_MAX = 100; // mensajes a conservar por usuario

const SYSTEM_BASE = `Sos el asistente de IA de Costify, una app para gestionar un negocio de fabricación a medida (costos, ventas, productos, materias primas, lista de compras, tareas y contenido de redes sociales).

Reglas:
- Hablás en español rioplatense, claro y conciso.
- Ayudás con la app y con los datos del negocio, y también podés responder consultas generales (ideas, textos, explicaciones).
- No inventes números del negocio: usá las HERRAMIENTAS para traer datos reales y actualizados cuando te pregunten por ventas, cobros, entregas, productos, materias primas, márgenes, clima o dólar.
- Para información actual de internet (noticias, datos del mundo, etc.) usá la herramienta buscarWeb.
- El "Resumen del negocio" te da un panorama inicial; si necesitás detalle o un período distinto, usá las herramientas.
- Después de usar una herramienta, respondé en lenguaje natural (no muestres el JSON crudo) y formateá montos en pesos.
- Podés CREAR y MODIFICAR cosas con herramientas: tareas (crear/completar/editar/borrar), publicaciones de contenido, ventas, cobros, despachos, productos e ítems de la lista de compras.
- CONFIRMACIÓN: antes de ejecutar acciones IMPORTANTES o DESTRUCTIVAS (borrarTarea, registrarCobro, marcarDespachada, crearVenta, crearProducto) resumí en una línea qué vas a hacer y pedí confirmación ("¿Lo confirmo?"). Recién ejecutá la herramienta cuando el usuario diga que sí. Para acciones livianas y claras (crearTarea, completarTarea, agregarListaCompra, crearPublicacion) podés hacerlo directo y avisar.
- FECHAS: si el usuario menciona un día (hoy, mañana, "el lunes", "en 3 días", una fecha concreta), SIEMPRE convertilo a YYYY-MM-DD usando la "Fecha de hoy" que figura abajo y pasalo en el parámetro de fecha. Nunca crees una tarea/venta/publicación con día mencionado dejando la fecha vacía.
- Si el día es ambiguo o no se entiende, NO adivines: preguntá antes.
- Cuando confirmes que hiciste algo, escribilo en lenguaje natural (no menciones marcadores internos).
- Usá formato markdown cuando ayude (listas, negritas).`;

const buildSystem = async () => {
  const [contexto, config] = await Promise.all([
    buildBusinessContext(),
    configuracionService.get().catch(() => null),
  ]);
  const perfil = config?.perfilNegocio?.trim();

  // Fecha actual en zona horaria Argentina, para que la IA resuelva bien
  // referencias relativas como "mañana", "el lunes", "la semana que viene".
  const hoyAR = new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());
  const hoyISO = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date()); // YYYY-MM-DD

  let system = SYSTEM_BASE;
  system += `\n\nFecha de hoy: ${hoyAR} (${hoyISO}, hora de Argentina). Usá esta fecha como referencia para calcular fechas relativas y pasalas a las herramientas en formato YYYY-MM-DD.`;
  if (perfil) {
    system += `\n\n--- Perfil del negocio (escrito por el dueño) ---\n${perfil}`;
  }
  system += `\n\n--- Resumen del negocio (datos reales) ---\n${contexto}`;
  return system;
};

// Persiste el último intercambio (mensaje del usuario + respuesta) y poda el historial.
const persistTurn = async (userId, userMsg, assistantMsg) => {
  if (!userId) return;
  try {
    const docs = [];
    if (userMsg) docs.push({ userId, role: "user", content: userMsg });
    if (assistantMsg) docs.push({ userId, role: "assistant", content: assistantMsg });
    if (docs.length) await ChatMessageModel.insertMany(docs);

    // Poda: dejar solo los HISTORIAL_MAX más recientes.
    const total = await ChatMessageModel.countDocuments({ userId });
    if (total > HISTORIAL_MAX) {
      const viejos = await ChatMessageModel.find({ userId })
        .sort({ createdAt: 1 })
        .limit(total - HISTORIAL_MAX)
        .select("_id")
        .lean();
      await ChatMessageModel.deleteMany({ _id: { $in: viejos.map((d) => d._id) } });
    }
  } catch (err) {
    logger.error("No se pudo persistir el historial del chat", { error: err.message });
  }
};

export const chatController = {
  async chat(req, res, next) {
    try {
      const userId = req.user?._id;
      const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
      if (!messages.length) {
        const error = new Error("Faltan mensajes en la consulta");
        error.status = 400;
        return next(error);
      }

      const system = await buildSystem();

      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("X-Accel-Buffering", "no");

      // Acciones de escritura ejecutadas con éxito → el front refresca esas entidades.
      const acciones = new Set();

      const full = await streamChat({
        system,
        messages: messages.map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: String(m.content || ""),
        })),
        tools: toolDeclarations,
        executeTool: async (name, args) => {
          const data = await executeTool(name, args, { userId });
          if (ENTIDAD_POR_TOOL[name] && data?.ok) acciones.add(ENTIDAD_POR_TOOL[name]);
          return data;
        },
        // Indicador "usando herramienta…" en el front (marcador que se oculta).
        onToolStart: (name) => res.write(`\n<<<COSTIFY_TOOL:${name}>>>`),
        onChunk: (text) => res.write(text),
      });

      // Marcador final: el front lo detecta, lo oculta y refresca esas entidades.
      if (acciones.size) {
        res.write(`\n<<<COSTIFY_REFRESH:${[...acciones].join(",")}>>>`);
      }

      res.end();

      // Guardar el turno (no bloquea la respuesta ya enviada).
      const ultimoUsuario = [...messages].reverse().find((m) => m.role !== "assistant");
      persistTurn(userId, String(ultimoUsuario?.content || ""), full);
    } catch (error) {
      logger.error("Error en el chat IA", { error: error.message });
      if (!res.headersSent) {
        error.status = error.status || 500;
        return next(error);
      }
      res.end();
    }
  },

  // Historial persistido del usuario (para reabrir el chat en cualquier dispositivo).
  async history(req, res, next) {
    try {
      const userId = req.user?._id;
      const docs = await ChatMessageModel.find({ userId })
        .sort({ createdAt: 1 })
        .limit(HISTORIAL_MAX)
        .select("role content createdAt")
        .lean();
      res.json({ messages: docs.map((d) => ({ role: d.role, content: d.content })) });
    } catch (error) {
      next(error);
    }
  },

  async clearHistory(req, res, next) {
    try {
      const userId = req.user?._id;
      await ChatMessageModel.deleteMany({ userId });
      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  },

  // Resumen proactivo determinístico (no consume cuota de IA).
  async resumen(req, res, next) {
    try {
      const texto = await buildResumenProactivo();
      res.json({ resumen: texto });
    } catch (error) {
      next(error);
    }
  },
};
