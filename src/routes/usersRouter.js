import express from "express";
import UsuariosController from "../controllers/usuarios.controller.js";
import passport from "passport";

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
  "/registro",
  passport.authenticate("registro", { session: false }),
  UsuariosController.registroUsuario
);

router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  UsuariosController.getUsuarios
);
router.get(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  UsuariosController.getUsuariosById
);
router.put(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  UsuariosController.updateUsuario
);
router.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  UsuariosController.deleteUsuario
);
router.post(
  "/login",
  passport.authenticate("login", { session: false }),
  UsuariosController.loginUsuario
);

router.post("/set-password", UsuariosController.setPassword);
