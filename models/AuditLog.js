// models/AuditLog.js
const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  // Mitä tapahtui
  action: {
    type: String,
    required: true,
    enum: [
      'login',           // käyttäjä kirjautui sisään
      'user_approved',   // pending → user
      'role_change',     // roolin vaihto
      'user_deleted',    // käyttäjä poistettu
      'limits_updated',  // rajoitukset päivitetty
      'tier_preset',     // tieri-preset asetettu (free/pro/agency)
    ]
  },

  // Kuka teki (admin tai järjestelmä)
  adminId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  adminEmail: { type: String },

  // Kohde (ketä toimenpide koski)
  targetId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  targetEmail: { type: String },

  // Lisätiedot (ennen/jälkeen-arvot tms.)
  details: { type: mongoose.Schema.Types.Mixed, default: {} },

  // Tekninen konteksti
  ip: { type: String },

  createdAt: { type: Date, default: Date.now }
});

// Indeksit nopeaan hakuun
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ adminId: 1 });
auditLogSchema.index({ targetId: 1 });

// Vanhenee 90 päivässä automaattisesti (TTL-indeksi)
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
