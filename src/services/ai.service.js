import { GoogleGenerativeAI } from "@google/generative-ai";

// Proveedor actual: Gemini (free tier). Para cambiar de proveedor en el futuro
// basta con reescribir streamChat manteniendo la misma firma.
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
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
 * @returns {Promise<string>}
 */
export const streamChat = async ({ system, messages = [], tools, executeTool, onChunk }) => {
  const genAI = getClient();
  if (!genAI) {
    throw new Error("GEMINI_API_KEY no está configurada en el servidor");
  }

  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: system,
    ...(tools?.length ? { tools: [{ functionDeclarations: tools }] } : {}),
  });

  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const last = messages[messages.length - 1];

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
        onChunk?.(text);
      }
    }

    const response = await result.response;
    const calls = response.functionCalls?.() || [];
    if (!calls.length) break;

    const responseParts = [];
    for (const call of calls) {
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
