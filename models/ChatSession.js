// models/ChatSession.js
const mongoose = require('mongoose');

const chatSessionSchema = new mongoose.Schema({
    botId:        { type: mongoose.Schema.Types.ObjectId, ref: 'ChatBot', required: true },
    userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sessionId:    { type: String, required: true, unique: true },  // UUID visitor-selaimessa
    visitorIp:    { type: String, default: '' },
    pageUrl:      { type: String, default: '' },
    messageCount: { type: Number, default: 0 },
    hasLead:      { type: Boolean, default: false },
    leadData:     { type: mongoose.Schema.Types.Mixed, default: null },
    lastMessageAt:{ type: Date, default: Date.now }
}, { timestamps: true });

chatSessionSchema.index({ botId: 1, createdAt: -1 });
chatSessionSchema.index({ sessionId: 1 });

module.exports = mongoose.model('ChatSession', chatSessionSchema);
