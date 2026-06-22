import { GoogleGenerativeAI } from "@google/generative-ai";

// Proveedor actual: Gemini (free tier). Para cambiar de proveedor en el futuro
// basta con reescribir streamChat manteniendo la misma firma.
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

let client = null;
const getClient = () => {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!client) client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return client;
};

/**
 * Stream de chat.
 * @param {Object} opts
 * @param {string} opts.system - instrucción de sistema (persona + contexto)
 * @param {Array<{role:'user'|'assistant', content:string}>} opts.messages
 * @param {(chunk:string)=>void} opts.onChunk - se llama por cada fragmento de texto
 * @returns {Promise<string>} texto completo
 */
export const streamChat = async ({ system, messages = [], onChunk }) => {
  const genAI = getClient();
  if (!genAI) {
    throw new Error("GEMINI_API_KEY no está configurada en el servidor");
  }

  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: system,
  });

  // Gemini requiere historial que arranque en 'user' y alterne user/model.
  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const last = messages[messages.length - 1];

  const chat = model.startChat({ history });
  const result = await chat.sendMessageStream(last?.content || "");

  let full = "";
  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      full += text;
      onChunk?.(text);
    }
  }
  return full;
};
