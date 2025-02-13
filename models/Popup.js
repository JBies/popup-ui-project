// models/Popup.js
const mongoose = require('mongoose');

const popupSchema = new mongoose.Schema({
    userId: { type: String, required: true }, // Käyttäjän ID
    popupType: { type: String, required: true }, // Popupin tyyppi (esim. 'square' tai 'circle')
    content: { type: String, required: true }, // Popupin sisältö
    createdAt: { type: Date, default: Date.now } // Luontiaika
});

module.exports = mongoose.model('Popup', popupSchema);