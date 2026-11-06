import crypto from "crypto";
import jwt from "jsonwebtoken";
import logger from "../config/logger.js";

// Tokens de sesión (JWT) y piezas del login con Google.

export const JWT_ALGORITHM = "HS256";
const DURACION_SESION = "8h";

const secreto = () => process.env.JWT_SECRET;

export const avisarSiSecretoDebil = () => {
  const s = secreto() || "";
  if (s.length < 32) {
    logger.error("JWT_SECRET falta o es demasiado corto (mínimo 32 caracteres): las sesiones no son seguras");
  }
};

export const firmarSesion = (usuario) =>
  jwt.sign({ id: String(usuario._id) }, secreto(), { algorithm: JWT_ALGORITHM, expiresIn: DURACION_SESION });

// ---------- Google: protección CSRF del flujo OAuth ----------
// Al iniciar se genera un nonce que va en una cookie httpOnly y, firmado junto con
// el origen del frontend, en el parámetro "state". En el callback ambos tienen que coincidir.
export const COOKIE_STATE = "costify_g_state";
const DURACION_STATE_MS = 10 * 60 * 1000;

export const crearStateGoogle = (origen) => {
  const nonce = crypto.randomBytes(16).toString("hex");
  const state = jwt.sign({ n: nonce, o: origen }, secreto(), { algorithm: JWT_ALGORITHM, expiresIn: "10m" });
  return { nonce, state, maxAge: DURACION_STATE_MS };
};

export const leerStateGoogle = (state, nonceCookie) => {
  try {
    const datos = jwt.verify(String(state || ""), secreto(), { algorithms: [JWT_ALGORITHM] });
    if (!nonceCookie || typeof datos.n !== "string") return null;
    const a = Buffer.from(datos.n);
    const b = Buffer.from(String(nonceCookie));
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    return { origen: datos.o };
  } catch {
    return null;
  }
};

export const leerCookie = (req, nombre) => {
  const header = req.headers?.cookie || "";
  for (const parte of header.split(";")) {
    const i = parte.indexOf("=");
    if (i > -1 && parte.slice(0, i).trim() === nombre) return decodeURIComponent(parte.slice(i + 1).trim());
  }
  return null;
};

// ---------- Google: código de un solo uso ----------
// El token de sesión no viaja en la URL: el callback redirige con un código
// aleatorio que dura 60 segundos y se canjea una sola vez por el token.
const codigos = new Map();
const DURACION_CODIGO_MS = 60 * 1000;

export const crearCodigoGoogle = (usuarioId) => {
  const ahora = Date.now();
  for (const [codigo, dato] of codigos) if (dato.vence < ahora) codigos.delete(codigo);
  const codigo = crypto.randomBytes(32).toString("base64url");
  codigos.set(codigo, { usuarioId: String(usuarioId), vence: ahora + DURACION_CODIGO_MS });
  return codigo;
};

export const canjearCodigoGoogle = (codigo) => {
  const dato = codigos.get(String(codigo || ""));
  if (!dato) return null;
  codigos.delete(String(codigo));
  return dato.vence >= Date.now() ? dato.usuarioId : null;
};
