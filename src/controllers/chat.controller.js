import { streamChat } from "../services/ai.service.js";
import { buildBusinessContext } from "../services/contextoNegocio.service.js";
import logger from "../config/logger.js";

const SYSTEM_BASE = `Sos el asistente de IA de Costify, una app para gestionar un negocio de fabricación a medida (costos, ventas, productos, materias primas, lista de compras, tareas y contenido de redes sociales).

Reglas:
- Hablás en español rioplatense, claro y conciso.
- Ayudás con la app y con los datos del negocio, y también podés responder consultas generales (ideas, textos, explicaciones).
- No inventes números del negocio: usá SOLO el "Resumen del negocio" que se te entrega. Si el dato no está ahí, decí que no lo tenés a mano.
- Si te preguntan por información en tiempo real (clima, dólar, noticias) aclará que por ahora no tenés acceso a datos en vivo.
- Usá formato markdown cuando ayude (listas, negritas).`;

export const chatController = {
  async chat(req, res, next) {
    try {
      const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
      if (!messages.length) {
        const error = new Error("Faltan mensajes en la consulta");
        error.status = 400;
        return next(error);
      }

      const contexto = await buildBusinessContext();
      const system = `${SYSTEM_BASE}\n\n--- Resumen del negocio (datos reales) ---\n${contexto}`;

      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("X-Accel-Buffering", "no");

      await streamChat({
        system,
        messages: messages.map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: String(m.content || ""),
        })),
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
