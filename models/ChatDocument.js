// models/ChatDocument.js
const mongoose = require('mongoose');

const chunkSchema = new mongoose.Schema({
    text:   { type: String, required: true },
    vector: { type: [Number], default: [] },   // embedding-vektori (1536 tai 768 dim)
    index:  { type: Number, required: true }
}, { _id: false });

const chatDocumentSchema = new mongoose.Schema({
    botId:  { type: mongoose.Schema.Types.ObjectId, ref: 'ChatBot', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    sourceType: { type: String, enum: ['pdf', 'txt', 'url'], required: true },
    sourceName: { type: String, required: true },   // tiedostonimi tai URL
    sourceUrl:  { type: String, default: '' },       // alkuperäinen URL (crawl-lähteille)

    chunks:      { type: [chunkSchema], default: [] },
    totalChunks: { type: Number, default: 0 },
    totalChars:  { type: Number, default: 0 },

    vectorized: { type: Boolean, default: false },   // onko vektorointi tehty
    crawlDepth: { type: Number, default: 0 },        // URL-crawlin syvyystaso
    error:      { type: String, default: null }      // virheviesti jos prosessointi epäonnistui

}, { timestamps: true });

chatDocumentSchema.index({ botId: 1 });

module.exports = mongoose.model('ChatDocument', chatDocumentSchema);
