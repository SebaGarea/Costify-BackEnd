import express from "express";
import mongoose from "mongoose";
import passport from "passport";
import helmet from "helmet";
import { iniciarPassport, config } from "./config/index.js";
import cors from "cors";
import { setupSwagger } from "./docs/swagger.js";

import {
  materiasPrimasRouter,
  plantillaCostoRouter,
  productoRouter,
  ventasRouter,
  userRouter,
  listaCompraRouter,
  tareasRouter,
} from "./routes/index.js";

import { errorHandler } from "./middlewares/error.handler.js";
import logger from "./config/logger.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(helmet({
  contentSecurityPolicy: false,
}));

iniciarPassport();
app.use(passport.initialize());

app.use("/uploads", express.static("uploads"));


const allowedOrigins = process.env.CORS_ORIGINS?.split(",") ?? ["http://localhost:5173"];
app.use(cors({ origin: allowedOrigins }));


app.use("/api/materiasPrimas", materiasPrimasRouter);
app.use("/api/plantillas", plantillaCostoRouter);
app.use("/api/productos", productoRouter);
app.use("/api/ventas", ventasRouter);
app.use("/api/usuarios", userRouter);
app.use("/api/lista-compras", listaCompraRouter);
app.use("/api/tareas", tareasRouter);

app.get("/health", (_req, res) => res.json({ status: "ok", timestamp: new Date() }));

setupSwagger(app);
app.use(errorHandler);

export const startServer = async () => {
  try {
    await mongoose.connect(config.MONGO_URL, {
      dbName: config.DB_NAME,
    });
    logger.info("Conexión a DB establecida");

    const server = app.listen(config.PORT, () => {
      logger.info(`Server escuchando en puerto ${config.PORT}`);
    });

    return server;
  } catch (err) {
    logger.error(`Error al conectarse con el servidor de BD: ${err.message}`);
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  logger.info(`Señal ${signal} recibida. Cerrando servidor...`);
  await mongoose.connection.close();
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

export default app;
