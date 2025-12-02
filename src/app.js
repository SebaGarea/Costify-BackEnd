import express from "express";
import mongoose from "mongoose";
import passport from "passport";
import { iniciarPassport, config } from "./config/index.js";
import cors from "cors";
import { setupSwagger } from "./docs/swagger.js";

import {
  materiasPrimasRouter,
  plantillaCostoRouter,
  productoRouter,
  ventasRouter,
  userRouter,
} from "./routes/index.js";

import { errorHandler } from "./middlewares/error.handler.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

iniciarPassport();
app.use(passport.initialize());

app.use("/uploads", express.static("uploads"));

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use("/api/materiasPrimas", materiasPrimasRouter);
app.use("/api/plantillas", plantillaCostoRouter);
app.use("/api/productos", productoRouter);
app.use("/api/ventas", ventasRouter);
app.use("/api/usuarios", userRouter);

setupSwagger(app);
app.use(errorHandler);

export const startServer = async () => {
  try {
    await mongoose.connect(config.MONGO_URL, {
      dbName: config.DB_NAME,
    });
    console.log("Conexión a DB establecida");

    const server = app.listen(config.PORT, () => {
      console.log(`Server escuchando en puerto ${config.PORT}`);
    });

    return server;
  } catch (err) {
    console.log(`Error al conectarse con el servidor de BD: ${err}`);
    process.exit(1); 
  }
};

export default app;
