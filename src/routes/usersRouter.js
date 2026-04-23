import express from "express";
import rateLimit from "express-rate-limit";
import {  UsuariosController  } from "../controllers/index.js";
import passport from "passport";
import { requireRole } from "../middlewares/auth/requireRole.js";
import {
  validacionRegistro,
  validacionLogin,
  validacionUpdate,
  validacionSetPassword,
  validacionIdUser,
  validacionChangePassword,
  validacionPerfil,
} from "../middlewares/validations/index.js";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos. Intentá de nuevo en 15 minutos." },
});

export const router = express.Router();

const defaultFrontendBase = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");

router.get("/auth/google", (req, res, next) => {
  const redirect = req.query.redirect ? encodeURIComponent(req.query.redirect) : "";
  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: redirect,
  })(req, res, next);
});

router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${defaultFrontendBase}/login`,
  }),
  UsuariosController.loginGoogleCallback
);

router.post(
  "/registro",
  validacionRegistro,
  UsuariosController.registroUsuario
);

router.get("/verify-email", UsuariosController.verifyEmail);

router.get(
  "/current",
  passport.authenticate("jwt", { session: false }),
  UsuariosController.currentUsuario
);

router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  UsuariosController.getUsuarios
);

router.post(
  "/invitaciones",
  passport.authenticate("jwt", { session: false }),
  requireRole("admin"),
  UsuariosController.crearInvitacion
);

router.get(
  "/invitaciones",
  passport.authenticate("jwt", { session: false }),
  requireRole("admin"),
  UsuariosController.listarInvitaciones
);

router.put(
  "/perfil",
  passport.authenticate("jwt", { session: false }),
  validacionPerfil,
  UsuariosController.updatePerfil
);

router.get(
  "/:id",
  validacionIdUser,
  passport.authenticate("jwt", { session: false }),
  UsuariosController.getUsuariosById
);

router.put(
  "/:id",
  validacionUpdate,
  passport.authenticate("jwt", { session: false }),
  UsuariosController.updateUsuario
);

router.delete(
  "/:id",
  validacionIdUser,
  passport.authenticate("jwt", { session: false }),
  UsuariosController.deleteUsuario
);

router.post(
  "/login",
  authLimiter,
  validacionLogin,
  passport.authenticate("login", { session: false }),
  UsuariosController.loginUsuario
);

router.post(
  "/set-password",
  authLimiter,
  passport.authenticate("jwt", { session: false }),
  validacionSetPassword,
  UsuariosController.setPassword
);

router.post(
  "/change-password",
  validacionChangePassword,
  passport.authenticate("jwt", { session: false }),
  UsuariosController.changePassword
);
