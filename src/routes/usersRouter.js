import { Router } from "express";
import UsuariosController from "../controllers/usuarios.controller.js";
import passport from "passport";
import jwt from "jsonwebtoken";

export const router = Router();

router.get("/", UsuariosController.getUsuarios);
router.get("/:id", UsuariosController.getUsuariosById);
router.put("/:id", UsuariosController.updateUsuario);
router.delete("/:id", UsuariosController.deleteUsuario);

router.post(
  "/login",
  passport.authenticate("login", { session: false }),
  UsuariosController.loginUsuario
);

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/" }),
  UsuariosController.loginGoogleCallback
);
router.post(
  "/registro",
  passport.authenticate("registro", { session: false }),
  UsuariosController.registroUsuario
);