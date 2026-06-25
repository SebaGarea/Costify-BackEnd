import { Router } from "express";
import passport from "passport";
import rateLimit from "express-rate-limit";
import { chatController } from "../controllers/index.js";

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas consultas seguidas. Esperá un momento." },
});

export const router = Router();

const auth = passport.authenticate("jwt", { session: false });

router.post("/", auth, chatLimiter, chatController.chat);
router.get("/history", auth, chatController.history);
router.delete("/history", auth, chatController.clearHistory);
router.get("/resumen", auth, chatController.resumen);
