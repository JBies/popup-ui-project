// models/ChatQA.js
const mongoose = require('mongoose');

const chatQASchema = new mongoose.Schema({
    botId:    { type: mongoose.Schema.Types.ObjectId, ref: 'ChatBot', required: true },
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    question: { type: String, required: true },
    answer:   { type: String, required: true },
    approved: { type: Boolean, default: false },
    priority: { type: Number, default: 0 },           // korkeampi = tärkeämpi
    source:   { type: String, enum: ['auto', 'manual'], default: 'manual' }
}, { timestamps: true });

chatQASchema.index({ botId: 1, approved: 1 });

module.exports = mongoose.model('ChatQA', chatQASchema);
