import express from 'express';
import mongoose from 'mongoose';
import { config } from './config/config.js';
import cors from 'cors';

import { router as materiasPrimasRouter } from './routes/materiasPrimasRouter.js';
import { router as plantillaCostoRouter } from './routes/plantillaCostoRouter.js';
import { router as productoRouter } from './routes/productoRouter.js';
import { router as ventasRouter } from './routes/ventasRouter.js';


const app=express();

app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.use('/uploads', express.static('uploads'));

app.use(cors({
  origin: 'http://localhost:5173'
}));                                       //CONFIGURACION DE CORS PARA QUE EL FRONTEND PUEDA ACCEDER

app.use('/api/materiasPrimas', materiasPrimasRouter);
app.use('/api/plantillas', plantillaCostoRouter);
app.use('/api/productos', productoRouter);
app.use('/api/ventas', ventasRouter);

const startServer = async () => {
    try {
        await mongoose.connect(config.MONGO_URL, {
            dbName: config.DB_NAME
        });
        console.log('Conexión a DB establecida');

        app.listen(config.PORT, () => {
            console.log(`Server escuchando en puerto ${config.PORT}`);
        });
    } catch (err) {
        console.log(`Error al conectarse con el servidor de BD: ${err}`);
        process.exit(1); // Finaliza el proceso si falla la conexión
    }
};

startServer();