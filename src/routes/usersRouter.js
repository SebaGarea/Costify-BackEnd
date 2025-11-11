import express from "express";
import UsuariosController from "../controllers/usuarios.controller.js";
import passport from "passport";
import { validacionRegistro, validacionLogin, validacionUpdate, validacionSetPassword, validacionIdUser } from "../middlewares/validations/users.validation.js";

export const router = express.Router();

router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  UsuariosController.loginGoogleCallback
);

router.post(
  "/registro",validacionRegistro,
  passport.authenticate("registro", { session: false }),
  UsuariosController.registroUsuario
);

router.get(
  "/current",passport.authenticate("jwt", { session: false }),
  UsuariosController.currentUsuario
);

router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  UsuariosController.getUsuarios
);
router.get(
  "/:id", validacionIdUser,
  passport.authenticate("jwt", { session: false }),
  UsuariosController.getUsuariosById
);
router.put(
  "/:id",validacionUpdate,
  passport.authenticate("jwt", { session: false }),
  UsuariosController.updateUsuario
);
router.delete(
  "/:id",validacionIdUser,
  passport.authenticate("jwt", { session: false }),
  UsuariosController.deleteUsuario
);
router.post(
  "/login",validacionLogin,
  passport.authenticate("login", { session: false }),
  UsuariosController.loginUsuario
);

router.post("/set-password",validacionSetPassword, UsuariosController.setPassword);
