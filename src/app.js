import express from 'express';
import mongoose from 'mongoose';
import { config } from './config/config.js';


import { router as materiasPrimasRouter } from './routes/materiasPrimasRouter.js';


const app=express();

app.use(express.json());
app.use(express.urlencoded({extended:true}));


app.use('/api/materiasPrimas', materiasPrimasRouter);


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