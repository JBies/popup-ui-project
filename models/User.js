// models/User.js
const mongoose = require('mongoose');

// Määritä käyttäjän skeema
const userSchema = new mongoose.Schema({
    googleId: { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { 
        type: String, 
        enum: ['admin', 'user', 'pending'], 
        default: 'pending'  // oletusrooli "pending"-tilaksi
    },
    profilePicture: { type: String }, // Google-profiilikuvan URL
    registeredAt: { type: Date, default: Date.now },
    lastLogin: { type: Date, default: Date.now },
    approvedAt: { type: Date } // Uusi kenttä hyväksymisajankohdalle
});

// Luo User-malli
// Määritä User-malli käyttäen userSchemaa
const User = mongoose.model('User', userSchema);

module.exports = User;