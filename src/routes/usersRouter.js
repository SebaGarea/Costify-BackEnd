import { Router } from "express";
import UsuariosController from "../controllers/usuarios.controller.js";
// import { auth } from "../middleware/auth.js";

export const router = Router();

router.get("/", UsuariosController.getUsuarios);
router.get("/:id", UsuariosController.getUsuariosById);
router.put("/:id", UsuariosController.updateUsuario);
router.delete("/:id", UsuariosController.deleteUsuario);
