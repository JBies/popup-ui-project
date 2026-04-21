const mongoose = require('mongoose');

const pageElementSchema = new mongoose.Schema({
  popupId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Popup', required: true },
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:        { type: String, enum: ['link', 'button', 'manual'], required: true },
  text:        { type: String, maxlength: 200, default: '' },
  href:        { type: String, default: '' },
  cssSelector: { type: String, default: '' },
  fingerprint: { type: String, required: true },
  clicks:      { type: Number, default: 0 },
  lastClicked: { type: Date },
  pageUrl:     { type: String, default: '' },
  active:      { type: Boolean, default: true },
  createdAt:   { type: Date, default: Date.now }
});

pageElementSchema.index({ popupId: 1, fingerprint: 1 }, { unique: true });
pageElementSchema.index({ popupId: 1, clicks: -1 });
pageElementSchema.index({ userId: 1 });

module.exports = mongoose.model('PageElement', pageElementSchema);
