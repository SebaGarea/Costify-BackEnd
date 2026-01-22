import mongoose from 'mongoose';
const {Schema} = mongoose;

const MateriaPrimaCollection = 'materias_primas';

const MateriaPrimaSchema = new Schema({

    nombre: {type:String, required:true},
    categoria: {type:String, required:true}, //Hierro/Madera/Herrajes/Pinturas/Buloneria
    type: {type:String, required:true}, //Cuadrado/Redondo/Bisagras/Tornillos
    nombreMadera: {type:String, trim:true}, //Solo se usa para carpintería
    medida: {type:String, required:true},//20x20/1.22x2.44/35mm/1"
    unidad: {type:String, required:true, trim:true, default:"unidad"},
    espesor: {type:String, required:false}, //1.2mm/1.6mm/2.0mm/etc - Opcional para materiales que no lo necesiten
    precio: {type:Number, min:0, required:true},
    stock: {type:Number, default:0, required:true},
    celdaExcel: {type:Number, required:false}
}, { timestamps: true })

export const MateriaPrimaModel = mongoose.model(MateriaPrimaCollection, MateriaPrimaSchema);



