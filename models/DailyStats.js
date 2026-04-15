// models/DailyStats.js
// Päiväkohtaiset näyttö- ja klikkausmäärät elementeittäin

const mongoose = require('mongoose');

const DailyStatsSchema = new mongoose.Schema({
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true },
  popupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Popup', required: true },
  date:    { type: String, required: true }, // 'YYYY-MM-DD'
  views:   { type: Number, default: 0 },
  clicks:  { type: Number, default: 0 },
}, { versionKey: false });

// Compound-indeksit nopeisiin haku- ja aggregaatiokyselyihin
DailyStatsSchema.index({ userId: 1, date: 1 });
DailyStatsSchema.index({ popupId: 1, date: 1 });
DailyStatsSchema.index({ userId: 1, popupId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyStats', DailyStatsSchema);
