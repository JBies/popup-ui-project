// utils/audit.js
// Keskitetty audit-lokitusapufunktio
// Käyttö: await logAudit(req, 'role_change', targetUser, { from: 'user', to: 'admin' })

const AuditLog = require('../models/AuditLog');

/**
 * Tallentaa audit-lokin tietokantaan.
 * @param {object} req        - Express request (adminId ja IP:n lukemiseen)
 * @param {string} action     - Toiminnon nimi (ks. AuditLog.action enum)
 * @param {object} [target]   - Kohde-käyttäjäobjekti { _id, email } tai null
 * @param {object} [details]  - Vapaamuotoiset lisätiedot (ennen/jälkeen tms.)
 */
async function logAudit(req, action, target = null, details = {}) {
  try {
    const admin = req.user;
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
              || req.socket?.remoteAddress
              || 'unknown';

    await AuditLog.create({
      action,
      adminId:     admin?._id  || null,
      adminEmail:  admin?.email || 'system',
      targetId:    target?._id  || null,
      targetEmail: target?.email || null,
      details,
      ip
    });
  } catch (err) {
    // Lokitusvirhe ei saa kaataa pääpyyntöä
    console.error('[audit] Lokitusvirhe:', err.message);
  }
}

module.exports = { logAudit };
