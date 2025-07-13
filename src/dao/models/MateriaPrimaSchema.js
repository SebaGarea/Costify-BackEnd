import mongoose from 'mongoose';
const {Schema} = mongoose;

const MateriaPrimaCollection = 'materias_primas';

const MateriaPrimaSchema = new Schema({

    nombre: {type:String, required:true},
    categoria: {type:String, required:true}, //Hierro/Madera/Herrajes/Pinturas/Buloneria
    type: {type:String, required:true}, //Cuadrado/Redondo/Bisagras/Tornillos
    medida: {type:String, required:true},//20x20/1.22x2.44/35mm/1"
    precio: {type:Number, min:0, required:true},
    stock: {type:Number, default:0, required:true}
})

export const MateriaPrimaModel = mongoose.model('MateriaPrimaCollection', MateriaPrimaSchema);