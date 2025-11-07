import mongoose from 'mongoose';

export const usuariosModelo = mongoose.model('users', new mongoose.Schema({
    first_name: {
        type: String,
        required: true
    },
    last_name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
    },
    age: {
        type: Number,
        required: true
    },
    password: {
        type: String,
        required: true
    },

    role: {
        type: String,
        default: 'user',
        enum: ['user', 'admin']  
    }
}));