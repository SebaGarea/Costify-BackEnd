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
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
    },
    password: {
        type: String,
        required: true
    },

    role: {
        type: String,
        default: 'user',
        enum: ['user', 'admin']  
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: {
        type: String
    },
    verificationExpires: {
        type: Date
    },
    invitationCode: {
        type: String,
        uppercase: true
    },
    googleId: {
        type: String
    },
    avatar: {
        type: String,
        maxlength: 500,
        default: ""
    },
    themePreference: {
        type: String,
        enum: ["light", "dark"],
        default: "dark"
    },
    statusMessage: {
        type: String,
        maxlength: 160,
        default: ""
    }
}));