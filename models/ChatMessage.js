// models/ChatMessage.js
const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
    sessionId: { type: String, required: true },
    botId:     { type: mongoose.Schema.Types.ObjectId, ref: 'ChatBot', required: true },
    role:      { type: String, enum: ['user', 'assistant'], required: true },
    content:   { type: String, required: true },
    tokensUsed:{ type: Number, default: 0 },
    provider:  { type: String, default: '' },   // esim. 'deepseek', 'openai'
    matchType: { type: String, enum: ['qa', 'rag', 'fallback', ''], default: '' }
}, { timestamps: true });

chatMessageSchema.index({ sessionId: 1, createdAt: 1 });
chatMessageSchema.index({ botId: 1, createdAt: -1 });

// TTL: poista viestit 180 päivän jälkeen
chatMessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 180 * 24 * 60 * 60 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
