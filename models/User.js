// models/User.js
const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - googleId
 *         - displayName
 *         - email
 *       properties:
 *         _id:
 *           type: string
 *           description: Käyttäjän MongoDB ID
 *         googleId:
 *           type: string
 *           description: Google OAuth ID
 *         displayName:
 *           type: string
 *           description: Käyttäjän näyttönimi
 *         email:
 *           type: string
 *           description: Käyttäjän sähköposti
 *         role:
 *           type: string
 *           enum: [admin, user, pending]
 *           default: pending
 *           description: Käyttäjän rooli
 *         profilePicture:
 *           type: string
 *           description: URL profiilikuvaan
 *         registeredAt:
 *           type: string
 *           format: date-time
 *           description: Rekisteröitymisaika
 *         lastLogin:
 *           type: string
 *           format: date-time
 *           description: Viimeisen kirjautumisen aika
 *         approvedAt:
 *           type: string
 *           format: date-time
 *           description: Hyväksymisaika
 *       example:
 *         _id: 60d21b4667d0d8992e610c85
 *         googleId: 123456789012345678901
 *         displayName: John Doe
 *         email: john.doe@example.com
 *         role: user
 *         profilePicture: https://lh3.googleusercontent.com/a/ABC123
 *         registeredAt: 2023-04-01T12:00:00.000Z
 *         lastLogin: 2023-04-02T10:30:00.000Z
 *         approvedAt: 2023-04-01T14:15:00.000Z
 */

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
    popupLimit: { 
        type: Number, 
        default: 1  // Oletusarvona 1 popup per käyttäjä
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