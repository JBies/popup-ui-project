const mongoose = require('mongoose');

const scrollStatsSchema = new mongoose.Schema({
  popupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Popup', required: true },
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date:    { type: String, required: true },
  pageUrl: { type: String, default: '' },
  buckets: {
    d10:  { type: Number, default: 0 },
    d25:  { type: Number, default: 0 },
    d50:  { type: Number, default: 0 },
    d75:  { type: Number, default: 0 },
    d90:  { type: Number, default: 0 },
    d100: { type: Number, default: 0 }
  },
  pauses: [{
    depth: { type: Number },
    count: { type: Number, default: 1 }
  }]
});

scrollStatsSchema.index({ popupId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('ScrollStats', scrollStatsSchema);
