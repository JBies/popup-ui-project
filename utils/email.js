// utils/email.js
// Nodemailer-alustus ja sähköpostin lähetys

const nodemailer = require('nodemailer');

// Luodaan transporter kerran (laiskasti – vasta ensimmäisellä lähetysyrityksellä)
let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn('[email] SMTP ei ole konfiguroitu (.env: SMTP_HOST, SMTP_USER, SMTP_PASS puuttuu)');
    return null;
  }

  _transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,   // true vain portille 465 (SSL), muuten STARTTLS
    auth: { user, pass },
    tls: { rejectUnauthorized: false } // Sallii itseisallatut sertifikaatit (tarvittaessa)
  });

  return _transporter;
}

/**
 * Lähettää sähköpostin.
 * @param {string} to      – Vastaanottajan osoite
 * @param {string} subject – Otsikko
 * @param {string} html    – HTML-runko
 * @returns {Promise<boolean>} true jos onnistui
 */
async function sendMail(to, subject, html) {
  const transporter = getTransporter();
  if (!transporter) return false;

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  try {
    await transporter.sendMail({ from, to, subject, html });
    console.log(`[email] Lähetetty: "${subject}" → ${to}`);
    return true;
  } catch (err) {
    console.error(`[email] Lähetysvirhe "${subject}" → ${to}:`, err.message);
    return false;
  }
}

module.exports = { sendMail };
