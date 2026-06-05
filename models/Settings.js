// models/Settings.js — järjestelmän globaalit asetukset (singleton)
const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    key: { type: String, default: 'global', unique: true },

    // Aktiivinen LLM-provider
    activeLlmProvider: {
        type: String,
        enum: ['deepseek', 'openai', 'gemini', 'anthropic'],
        default: 'deepseek'
    },

    // Per-provider mallit
    llmModels: {
        deepseek:  { type: String, default: 'deepseek-chat' },
        openai:    { type: String, default: 'gpt-4o-mini' },
        gemini:    { type: String, default: 'gemini-2.0-flash' },
        anthropic: { type: String, default: 'claude-haiku-4-5-20251001' }
    },

    // API-avaimet (tallennetaan suojattuina — ei koskaan palauteta clientille)
    apiKeys: {
        deepseek:  { type: String, default: '' },
        openai:    { type: String, default: '' },
        gemini:    { type: String, default: '' },
        anthropic: { type: String, default: '' }
    },

    // Embeddings-provider
    embeddingsProvider: {
        type: String,
        enum: ['openai', 'gemini'],
        default: 'openai'
    },

    // Teksti joka näytetään widgetin footerissa
    widgetPoweredByLabel: { type: String, default: 'DeepSeek AI' },

    // Uusien käyttäjien oletusrajoitukset (admin voi muuttaa per käyttäjä)
    defaultChatbotLimits: {
        maxBots:               { type: Number, default: 0 },
        maxChunksPerBot:       { type: Number, default: 500 },
        maxDocumentsPerBot:    { type: Number, default: 10 },
        maxPagesPerCrawl:      { type: Number, default: 50 },
        maxCrawlDepth:         { type: Number, default: 2 },
        maxMessagesPerDay:     { type: Number, default: 200 },
        maxMessagesPerMonth:   { type: Number, default: 3000 },
        maxMessagesPerSession: { type: Number, default: 20 },
        maxCharsPerMessage:    { type: Number, default: 500 }
    }
}, { timestamps: true });

// Apumetodi: hae tai luo globaalit asetukset
settingsSchema.statics.getGlobal = async function () {
    let settings = await this.findOne({ key: 'global' });
    if (!settings) {
        settings = await this.create({ key: 'global' });
    }
    return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);
