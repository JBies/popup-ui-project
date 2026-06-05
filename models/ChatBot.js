// models/ChatBot.js
const mongoose = require('mongoose');

const chatBotSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Perustiedot
    name:        { type: String, required: true, default: 'Chatbot' },
    isActive:    { type: Boolean, default: true },
    mode:        { type: String, enum: ['qa', 'ai'], default: 'ai' },

    // Floating-painike
    button: {
        shape:      { type: String, enum: ['circle', 'rounded'], default: 'circle' },
        size:       { type: Number, default: 56 },          // px
        iconType:   { type: String, enum: ['emoji', 'image', 'svg'], default: 'svg' },
        iconValue:  { type: String, default: 'chat' },      // emoji-merkki, kuvan URL tai svg-nimi
        color:      { type: String, default: '#2563EB' },   // taustaväri
        iconColor:  { type: String, default: '#ffffff' },
        position:   { type: String, enum: ['bottom-right', 'bottom-left', 'top-right', 'top-left'], default: 'bottom-right' },
        offsetX:    { type: Number, default: 20 },          // px
        offsetY:    { type: Number, default: 20 }
    },

    // Heräteteksti painikkeen yläpuolella
    grabber: {
        enabled:   { type: Boolean, default: true },
        text:      { type: String, default: 'Onko sinulla kysyttävää? 💬' },
        delayMs:   { type: Number, default: 3000 },         // ms ennen ilmestymistä
        frequency: { type: String, enum: ['always', 'once-per-session', 'never'], default: 'once-per-session' }
    },

    // Animaatiot
    animation: {
        intro:         { type: String, enum: ['slide-in', 'fade-in', 'pop', 'none'], default: 'slide-in' },
        idle:          { type: String, enum: ['wiggle', 'pulse', 'bounce', 'none'], default: 'wiggle' },
        idleIntervalS: { type: Number, default: 10 }        // sekuntia idle-animaatioiden välillä
    },

    // Chat-ikkuna
    window: {
        botName:          { type: String, default: 'Avustaja' },
        botAvatarType:    { type: String, enum: ['emoji', 'image', 'initials'], default: 'emoji' },
        botAvatarValue:   { type: String, default: '🤖' },
        headerColor:      { type: String, default: '#2563EB' },
        headerTextColor:  { type: String, default: '#ffffff' },
        botBubbleColor:   { type: String, default: '#f1f5f9' },
        botTextColor:     { type: String, default: '#1e293b' },
        userBubbleColor:  { type: String, default: '#2563EB' },
        userTextColor:    { type: String, default: '#ffffff' },
        chatBgColor:      { type: String, default: '#ffffff' },
        size:             { type: String, enum: ['normal', 'large'], default: 'normal' }
    },

    // Käyttäytyminen
    behavior: {
        primaryLanguage:    { type: String, default: 'fi' },
        welcomeMessage:     { type: String, default: 'Hei! Kuinka voin auttaa sinua tänään?' },
        inputPlaceholder:   { type: String, default: 'Kirjoita viestisi...' },
        systemPrompt:       { type: String, default: '' },
        fallbackMessage:    { type: String, default: 'En löydä vastausta tähän kysymykseen. Ota yhteyttä meihin suoraan.' },
        fallbackContactUrl: { type: String, default: '' },
        temperature:        { type: Number, default: 0.3 }
    },

    // Liidilomake
    leadForm: {
        enabled:  { type: Boolean, default: false },
        timing:   { type: String, enum: ['before', 'after-first', 'never'], default: 'after-first' },
        required: { type: Boolean, default: false },
        fields:   {
            name:  { type: Boolean, default: true },
            email: { type: Boolean, default: true },
            phone: { type: Boolean, default: false }
        }
    },

    // "Powered by X" -teksti widgetissä (null = käytetään globaalia Settings-arvoa)
    poweredByLabel: { type: String, default: null }

}, { timestamps: true });

module.exports = mongoose.model('ChatBot', chatBotSchema);
