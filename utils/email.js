// utils/email.js
// Brevo HTTP API – lähettää sähköpostia HTTPS:n kautta (portti 443).
// SMTP-portit (587/465) on blokattuna DigitalOceanilta, joten käytetään API:a.
//
// Tarvittavat .env-muuttujat:
//   SMTP_PASS  = Brevo API-avain (xsmtpsib-...)
//   SMTP_FROM  = "Nimi <osoite>" tai pelkkä osoite – täytyy olla vahvistettu Brevossa

const https = require('https');

/**
 * Parsii "Nimi <email>" tai pelkän "email" → { name, email }
 */
function parseSender(fromStr) {
  if (!fromStr) return { name: 'UI Manager', email: '' };
  const match = fromStr.match(/^(.+?)\s*<(.+?)>$/);
  if (match) return { name: match[1].trim(), email: match[2].trim() };
  return { name: 'UI Manager', email: fromStr.trim() };
}

/**
 * Lähettää sähköpostin Brevo API:n kautta.
 * @param {string} to      – Vastaanottajan sähköpostiosoite
 * @param {string} subject – Viestin otsikko
 * @param {string} html    – HTML-sisältö
 * @returns {Promise<boolean>} true = onnistui, false = epäonnistui
 */
async function sendMail(to, subject, html) {
  const apiKey = process.env.SMTP_PASS;
  const fromStr = process.env.SMTP_FROM || process.env.SMTP_USER;

  if (!apiKey) {
    console.warn('[email] Brevo API-avain puuttuu (.env: SMTP_PASS)');
    return false;
  }

  const sender = parseSender(fromStr);

  if (!sender.email) {
    console.warn('[email] Lähettäjän sähköposti puuttuu (.env: SMTP_FROM)');
    return false;
  }

  const body = JSON.stringify({
    sender:      { name: sender.name, email: sender.email },
    to:          [{ email: to }],
    subject,
    htmlContent: html,
  });

  return new Promise((resolve) => {
    const options = {
      hostname: 'api.brevo.com',
      path:     '/v3/smtp/email',
      method:   'POST',
      headers:  {
        'api-key':        apiKey,
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`[email] Lähetetty: "${subject}" → ${to}`);
          resolve(true);
        } else {
          console.error(`[email] Lähetysvirhe "${subject}" → ${to}: HTTP ${res.statusCode}`, data);
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      console.error(`[email] Lähetysvirhe "${subject}" → ${to}:`, err.message);
      resolve(false);
    });

    req.write(body);
    req.end();
  });
}

module.exports = { sendMail };
