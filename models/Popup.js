// Popup.js
const mongoose = require('mongoose');

const popupSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    //name: {type: String, default: "testi"},
    popupType: { type: String, required: true },
    content: { type: String, required: true },
    width: { type: Number, default: 200 },
    height: { type: Number, default: 150 },
    position: { type: String, default: 'center' },
    animation: { type: String, default: 'none' },
    backgroundColor: { type: String, default: '#ffffff' },
    textColor: { type: String, default: '#000000' },
    timing: {
        delay: { type: Number, default: 0 }, // Viive sivun latauksen jälkeen (sekunteina)
        showDuration: { type: Number, default: 0 }, // Näyttöaika (0 = pysyy kunnes suljetaan)
        frequency: { type: String, default: 'always' }, // 'always', 'once', 'daily', 'weekly'
        startDate: { type: String, default: "default" }, // Alkamispäivä
        endDate: { type: String, default: "default" }    // Päättymispäivä
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Popup', popupSchema);