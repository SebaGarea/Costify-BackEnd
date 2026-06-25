import { GoogleGenerativeAI } from "@google/generative-ai";

// Proveedor actual: Gemini (free tier). Para cambiar de proveedor en el futuro
// basta con reescribir streamChat manteniendo la misma firma.
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
// Modelo de respaldo: si el principal falla (ej: cuota/429) antes de empezar a
// responder, reintentamos una vez con este.
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || "gemini-2.0-flash";
const MAX_TOOL_ROUNDS = 5;

let client = null;
const getClient = () => {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!client) client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return client;
};

/**
 * Stream de chat con soporte de tool-calling.
 * @param {Object} opts
 * @param {string} opts.system
 * @param {Array<{role:'user'|'assistant', content:string}>} opts.messages
 * @param {Array} [opts.tools] - functionDeclarations (formato Gemini)
 * @param {(name:string, args:object)=>Promise<any>} [opts.executeTool]
 * @param {(chunk:string)=>void} opts.onChunk
 * @param {(name:string)=>void} [opts.onToolStart] - se llama al ejecutar una herramienta
 * @returns {Promise<string>}
 */
export const streamChat = async ({ system, messages = [], tools, executeTool, onChunk, onToolStart }) => {
  const genAI = getClient();
  if (!genAI) {
    throw new Error("GEMINI_API_KEY no está configurada en el servidor");
  }

  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const last = messages[messages.length - 1];

  // Corre toda la conversación con un modelo concreto. Devuelve {full, emitted}.
  const runWith = async (modelName) => {
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: system,
      ...(tools?.length ? { tools: [{ functionDeclarations: tools }] } : {}),
    });

    const chat = model.startChat({ history });
    let result = await chat.sendMessageStream(last?.content || "");
    let full = "";
    let emitted = false;

    for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
      for await (const chunk of result.stream) {
        let text = "";
        try {
          text = chunk.text();
        } catch {
          text = ""; // chunk de function-call: no tiene texto
        }
        if (text) {
          full += text;
          emitted = true;
          onChunk?.(text);
        }
      }

      const response = await result.response;
      const calls = response.functionCalls?.() || [];
      if (!calls.length) break;

      const responseParts = [];
      for (const call of calls) {
        onToolStart?.(call.name);
        let data;
        try {
          data = executeTool ? await executeTool(call.name, call.args || {}) : { error: "Sin ejecutor de herramientas" };
        } catch (err) {
          data = { error: err.message };
        }
        responseParts.push({
          functionResponse: {
            name: call.name,
            response: data && typeof data === "object" ? data : { result: data },
          },
        });
      }

      result = await chat.sendMessageStream(responseParts);
    }

    return { full, emitted };
  };

  try {
    const { full } = await runWith(MODEL);
    return full;
  } catch (err) {
    // Reintento con el modelo de respaldo solo si el principal falló de entrada.
    if (FALLBACK_MODEL && FALLBACK_MODEL !== MODEL) {
      try {
        const { full } = await runWith(FALLBACK_MODEL);
        return full;
      } catch {
        throw err; // si el fallback también falla, propagamos el error original
      }
    }
    throw err;
  }
};

/**
 * Búsqueda web mediante el grounding de Google de Gemini.
 * Se hace en una request aparte porque la búsqueda nativa no se puede combinar
 * con function-calling en la misma llamada.
 * @param {string} query
 * @returns {Promise<string>}
 */
export const webSearch = async (query) => {
  const genAI = getClient();
  if (!genAI) throw new Error("GEMINI_API_KEY no está configurada en el servidor");
  const model = genAI.getGenerativeModel({
    model: MODEL,
    tools: [{ googleSearch: {} }],
  });
  const result = await model.generateContent(query);
  return result.response.text();
};
