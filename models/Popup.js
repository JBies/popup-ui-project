// Popup.js
const mongoose = require('mongoose');

const popupSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    popupType: { type: String, required: true },
    content: { type: String, required: true },
    width: { type: Number, default: 200 },
    height: { type: Number, default: 150 },
    position: { type: String, default: 'center' },
    animation: { type: String, default: 'none' },
    backgroundColor: { type: String, default: '#ffffff' },
    textColor: { type: String, default: '#000000' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Popup', popupSchema);