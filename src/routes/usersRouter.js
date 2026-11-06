import express from "express";
import rateLimit from "express-rate-limit";
import {  UsuariosController  } from "../controllers/index.js";
import passport from "passport";
import { requireRole } from "../middlewares/auth/requireRole.js";
import { bloquearEnDemo } from "../config/demo.js";
import {
  validacionRegistro,
  validacionLogin,
  validacionUpdate,
  validacionSetPassword,
  validacionIdUser,
  validacionChangePassword,
  validacionPerfil,
} from "../middlewares/validations/index.js";

const limitador = (max, mensaje) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: mensaje, mensaje },
  });

// Login: 10 intentos fallidos cada 15 minutos por IP (los exitosos no cuentan).
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Demasiados intentos. Intentá de nuevo en 15 minutos.",
    mensaje: "Demasiados intentos. Intentá de nuevo en 15 minutos.",
  },
});
const authLimiter = limitador(10, "Demasiados intentos. Intentá de nuevo en 15 minutos.");
const googleLimiter = limitador(30, "Demasiados intentos con Google. Intentá de nuevo en 15 minutos.");

const auth = passport.authenticate("jwt", { session: false });

export const router = express.Router();

router.get("/auth/google", googleLimiter, UsuariosController.iniciarGoogle);
router.get("/auth/google/callback", googleLimiter, UsuariosController.loginGoogleCallback);
router.post("/auth/google/canjear", googleLimiter, UsuariosController.canjearGoogle);

router.post(
  "/registro",
  authLimiter,
  validacionRegistro,
  UsuariosController.registroUsuario
);

router.get("/verify-email", authLimiter, UsuariosController.verifyEmail);

router.get("/current", auth, UsuariosController.currentUsuario);

router.get("/", auth, requireRole("admin"), UsuariosController.getUsuarios);

router.post(
  "/invitaciones",
  auth,
  requireRole("admin"),
  UsuariosController.crearInvitacion
);

router.get(
  "/invitaciones",
  auth,
  requireRole("admin"),
  UsuariosController.listarInvitaciones
);

router.put("/perfil", auth, validacionPerfil, UsuariosController.updatePerfil);

router.post(
  "/login",
  loginLimiter,
  validacionLogin,
  passport.authenticate("login", { session: false }),
  UsuariosController.loginUsuario
);

// Fijar la contraseña de otro usuario: solo un admin.
router.post(
  "/set-password",
  authLimiter,
  auth,
  requireRole("admin"),
  validacionSetPassword,
  UsuariosController.setPassword
);

router.post(
  "/change-password",
  authLimiter,
  auth,
  bloquearEnDemo("En la demo no se puede cambiar la contraseña."),
  validacionChangePassword,
  UsuariosController.changePassword
);

// Administración de usuarios: solo admin (el propio usuario usa /current y /perfil).
router.get("/:id", validacionIdUser, auth, requireRole("admin"), UsuariosController.getUsuariosById);
router.put("/:id", validacionUpdate, auth, requireRole("admin"), UsuariosController.updateUsuario);
router.delete("/:id", validacionIdUser, auth, requireRole("admin"), UsuariosController.deleteUsuario);
