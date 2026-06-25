import { GoogleGenerativeAI } from "@google/generative-ai";

// Proveedor actual: Gemini (free tier). Para cambiar de proveedor en el futuro
// basta con reescribir streamChat manteniendo la misma firma.
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
// Modelo de respaldo: si el principal falla (ej: cuota/429) antes de empezar a
// responder, reintentamos una vez con este.
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || "gemini-2.0-flash";
const MAX_TOOL_ROUNDS = 5;
const MAX_REINTENTOS = 2; // por modelo, ante errores transitorios

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 503 (sobrecargado), 429 (rate limit), 500 o fallo de red: vale reintentar.
const esTransitorio = (e) => {
  const s = e?.status;
  const m = (e?.message || "").toLowerCase();
  return (
    s === 503 || s === 429 || s === 500 ||
    m.includes("overloaded") ||
    m.includes("unavailable") ||
    m.includes("503") ||
    m.includes("fetch")
  );
};

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

  // Si ya empezamos a enviarle texto al cliente, no podemos reintentar sin
  // duplicar la respuesta. Por eso rastreamos si se emitió algo.
  let emittedAny = false;
  const emit = (text) => {
    emittedAny = true;
    onChunk?.(text);
  };

  // Corre toda la conversación con un modelo concreto. Devuelve el texto completo.
  const runWith = async (modelName) => {
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: system,
      ...(tools?.length ? { tools: [{ functionDeclarations: tools }] } : {}),
    });

    const chat = model.startChat({ history });
    let result = await chat.sendMessageStream(last?.content || "");
    let full = "";

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
          emit(text);
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

    return full;
  };

  // Probamos el modelo principal y luego el de respaldo. Ante errores
  // transitorios (503/429/...) reintentamos con backoff, siempre que todavía
  // no se haya emitido texto al cliente.
  const candidatos = [MODEL, FALLBACK_MODEL].filter((v, i, a) => v && a.indexOf(v) === i);
  let lastErr;
  for (const modelName of candidatos) {
    for (let intento = 0; intento < MAX_REINTENTOS; intento += 1) {
      try {
        return await runWith(modelName);
      } catch (err) {
        lastErr = err;
        if (emittedAny) throw err; // no reintentar: duplicaría la respuesta
        if (!esTransitorio(err)) break; // error no transitorio: pasar al fallback
        await sleep(500 * (intento + 1));
      }
    }
  }
  throw lastErr;
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
