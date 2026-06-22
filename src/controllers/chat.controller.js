import { streamChat } from "../services/ai.service.js";
import { buildBusinessContext } from "../services/contextoNegocio.service.js";
import { toolDeclarations, executeTool } from "../services/herramientas.service.js";
import { configuracionService } from "../services/configuracion.service.js";
import logger from "../config/logger.js";

const SYSTEM_BASE = `Sos el asistente de IA de Costify, una app para gestionar un negocio de fabricación a medida (costos, ventas, productos, materias primas, lista de compras, tareas y contenido de redes sociales).

Reglas:
- Hablás en español rioplatense, claro y conciso.
- Ayudás con la app y con los datos del negocio, y también podés responder consultas generales (ideas, textos, explicaciones).
- No inventes números del negocio: usá las HERRAMIENTAS para traer datos reales y actualizados cuando te pregunten por ventas, cobros, entregas, productos, clima o dólar.
- El "Resumen del negocio" te da un panorama inicial; si necesitás detalle o un período distinto, usá las herramientas.
- Después de usar una herramienta, respondé en lenguaje natural (no muestres el JSON crudo) y formateá montos en pesos.
- Podés CREAR cosas: tareas (crearTarea) y publicaciones de contenido con el copy ya escrito (crearPublicacion). Si la instrucción es clara, hacelo y avisá qué creaste. Si es ambigua (falta fecha, producto, etc.), preguntá antes.
- Usá formato markdown cuando ayude (listas, negritas).`;

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

      const [contexto, config] = await Promise.all([
        buildBusinessContext(),
        configuracionService.get().catch(() => null),
      ]);
      const perfil = config?.perfilNegocio?.trim();

      let system = SYSTEM_BASE;
      if (perfil) {
        system += `\n\n--- Perfil del negocio (escrito por el dueño) ---\n${perfil}`;
      }
      system += `\n\n--- Resumen del negocio (datos reales) ---\n${contexto}`;

      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("X-Accel-Buffering", "no");

      await streamChat({
        system,
        messages: messages.map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: String(m.content || ""),
        })),
        tools: toolDeclarations,
        executeTool: (name, args) => executeTool(name, args, { userId }),
        onChunk: (text) => res.write(text),
      });

      res.end();
    } catch (error) {
      logger.error("Error en el chat IA", { error: error.message });
      if (!res.headersSent) {
        error.status = error.status || 500;
        return next(error);
      }
      res.end();
    }
  },
};
