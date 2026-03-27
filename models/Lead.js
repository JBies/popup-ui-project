const mongoose = require('mongoose');
const LeadSchema = new mongoose.Schema({
  popupId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Popup', required: true },
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  data:        { type: mongoose.Schema.Types.Mixed, default: {} },
  variant:     { type: String, default: 'A' },
  submittedAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Lead', LeadSchema);
