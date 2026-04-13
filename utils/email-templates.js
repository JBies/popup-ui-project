// utils/email-templates.js
// HTML-sähköpostipohjat: liidi-ilmoitus, viikkoraportti, tervetuloa

const APP_URL = process.env.APP_URL || 'https://popupmanager.net';
const BRAND   = 'UI Manager';

// ─── Yhteinen wrapper ─────────────────────────────────────────────────────────

function emailWrapper(bodyHtml, preheader = '') {
  return `<!DOCTYPE html>
<html lang="fi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${BRAND}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif">
  ${preheader ? `<span style="display:none;max-height:0;overflow:hidden;mso-hide:all">${preheader}</span>` : ''}
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

        <!-- Header -->
        <tr>
          <td style="background:#1e40af;border-radius:12px 12px 0 0;padding:20px 32px;text-align:center">
            <span style="color:#fff;font-size:20px;font-weight:700;letter-spacing:-0.5px">${BRAND}</span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#fff;border-radius:0 0 12px 12px;padding:32px;border:1px solid #e2e8f0;border-top:none">
            ${bodyHtml}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 0;text-align:center;font-size:12px;color:#94a3b8">
            ${BRAND} · <a href="${APP_URL}/dashboard#settings" style="color:#94a3b8">Hallitse ilmoituksia</a>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function btn(href, text, color = '#1e40af') {
  return `<a href="${href}" style="display:inline-block;background:${color};color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;margin-top:16px">${text}</a>`;
}

function delta(pct) {
  if (pct === null || pct === undefined) return '';
  if (pct > 0) return `<span style="color:#16a34a;font-size:12px;margin-left:6px">▲ +${pct}%</span>`;
  if (pct < 0) return `<span style="color:#dc2626;font-size:12px;margin-left:6px">▼ ${pct}%</span>`;
  return `<span style="color:#64748b;font-size:12px;margin-left:6px">→ 0%</span>`;
}

// ─── 1. Liidi-ilmoitus ────────────────────────────────────────────────────────

/**
 * Rakentaa liidi-ilmoitussähköpostin.
 * @param {Object} popup  – Popup-dokumentti (name, elementType)
 * @param {Object} lead   – Lead-dokumentti (data, submittedAt)
 * @returns {{ subject: string, html: string }}
 */
function buildLeadNotification(popup, lead) {
  const subject = `🎉 Uusi liidi – ${popup.name || 'Tuntematon elementti'}`;
  const time = new Date(lead.submittedAt).toLocaleString('fi-FI', { timeZone: 'Europe/Helsinki' });

  // Lomakkeen kentät taulukoksi
  const fields = lead.data && typeof lead.data === 'object' ? Object.entries(lead.data) : [];

  // "Vastaa liidiin" – etsitään email-kenttä
  const emailValue = fields.find(([k, v]) => k.toLowerCase().includes('email') || k.toLowerCase().includes('sähköposti'))?.[1];
  const replyBtn = emailValue
    ? `<br>${btn(`mailto:${emailValue}?subject=Yhteydenotto&body=Hei,`, '📧 Vastaa liidiin', '#16a34a')}`
    : '';

  const fieldsHtml = fields.length > 0
    ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;border-collapse:collapse">
        ${fields.map(([key, val]) => `
          <tr>
            <td style="padding:10px 12px;background:#f8fafc;border:1px solid #e2e8f0;font-size:13px;font-weight:600;color:#374151;width:40%;vertical-align:top">${escHtml(String(key))}</td>
            <td style="padding:10px 12px;border:1px solid #e2e8f0;font-size:13px;color:#0f172a;word-break:break-word">${escHtml(String(val ?? ''))}</td>
          </tr>`).join('')}
      </table>`
    : '<p style="color:#64748b;font-size:13px;margin-top:12px">Lomake lähetettiin ilman kenttiä.</p>';

  const body = `
    <div style="margin-bottom:6px">
      <span style="background:#dcfce7;color:#16a34a;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700">UUSI LIIDI</span>
    </div>
    <h1 style="font-size:22px;font-weight:800;color:#0f172a;margin:12px 0 4px">${escHtml(popup.name || 'Elementti')}</h1>
    <p style="font-size:13px;color:#64748b;margin:0 0 20px">${time}</p>

    <div style="background:#f8fafc;border-left:4px solid #1e40af;border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:4px">
      <div style="font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">Lomakkeen tiedot</div>
      ${fieldsHtml}
    </div>

    <div style="margin-top:20px;display:flex;gap:8px">
      ${btn(`${APP_URL}/dashboard#leads`, '📋 Katso kaikki liidit')}
      ${replyBtn}
    </div>`;

  return { subject, html: emailWrapper(body, `Uusi liidi elementistä ${popup.name}`) };
}

// ─── 2. Viikkoraportti ────────────────────────────────────────────────────────

/**
 * Rakentaa viikkoraporttisähköpostin.
 * @param {Object} user    – User-dokumentti (displayName)
 * @param {Object} stats   – { views, clicks, leads, prevViews, prevClicks, prevLeads }
 * @param {Array}  topEls  – Top-elementit: [{ name, views, clicks, leads }]
 * @param {Array}  leads   – Viikon uusimmat liidit (max 10)
 * @param {string} weekLabel – Esim. "17.–23.6.2025"
 * @returns {{ subject: string, html: string }}
 */
function buildWeeklyReport(user, stats, topEls, leads, weekLabel) {
  const subject = `📊 Viikkoraportti ${weekLabel} – ${BRAND}`;
  const firstName = (user.displayName || 'Hei').split(' ')[0];

  function pct(current, prev) {
    if (!prev) return current > 0 ? 100 : null;
    return Math.round(((current - prev) / prev) * 100);
  }

  const statBox = (icon, label, value, change) => `
    <td style="text-align:center;padding:16px 8px;background:#f8fafc;border-radius:10px">
      <div style="font-size:22px;margin-bottom:4px">${icon}</div>
      <div style="font-size:26px;font-weight:800;color:#0f172a">${value}</div>
      <div style="font-size:12px;color:#64748b;margin-top:2px">${label}${delta(change)}</div>
    </td>`;

  const statsRow = `
    <table width="100%" cellpadding="6" cellspacing="0">
      <tr>
        ${statBox('👁️', 'Näyttöä', stats.views, pct(stats.views, stats.prevViews))}
        <td width="8"></td>
        ${statBox('🖱️', 'Klikkausta', stats.clicks, pct(stats.clicks, stats.prevClicks))}
        <td width="8"></td>
        ${statBox('📋', 'Liidiä', stats.leads, pct(stats.leads, stats.prevLeads))}
      </tr>
    </table>`;

  const topElsHtml = topEls.length > 0
    ? `<div style="margin-top:28px">
        <div style="font-size:14px;font-weight:700;color:#0f172a;margin-bottom:12px">🏆 Parhaat elementit</div>
        ${topEls.slice(0, 3).map((el, i) => `
          <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:${i===0?'#eff6ff':'#f8fafc'};border-radius:8px;margin-bottom:6px">
            <span style="font-size:16px">${['🥇','🥈','🥉'][i]}</span>
            <div style="flex:1">
              <div style="font-size:13px;font-weight:600;color:#0f172a">${escHtml(el.name)}</div>
              <div style="font-size:11px;color:#64748b">${el.views} näyttöä · ${el.clicks} klikkausta · ${el.leads} liidiä</div>
            </div>
          </div>`).join('')}
      </div>`
    : '';

  const leadsHtml = leads.length > 0
    ? `<div style="margin-top:28px">
        <div style="font-size:14px;font-weight:700;color:#0f172a;margin-bottom:12px">📋 Viikon uusimmat liidit (${leads.length} kpl)</div>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
          ${leads.slice(0, 10).map(l => {
            const d = l.data || {};
            const preview = Object.values(d).filter(Boolean).slice(0, 2).map(v => String(v)).join(' · ') || '(tyhjä)';
            const t = new Date(l.submittedAt).toLocaleDateString('fi-FI');
            return `<tr>
              <td style="padding:8px 10px;border-bottom:1px solid #f1f5f9;font-size:12px;color:#374151">${escHtml(preview)}</td>
              <td style="padding:8px 10px;border-bottom:1px solid #f1f5f9;font-size:11px;color:#94a3b8;white-space:nowrap">${t}</td>
            </tr>`;
          }).join('')}
        </table>
      </div>`
    : '';

  const body = `
    <p style="font-size:16px;color:#374151;margin:0 0 20px">Hei ${escHtml(firstName)}! Tässä viikkosi yhteenveto <strong>${escHtml(weekLabel)}</strong>:</p>
    ${statsRow}
    ${topElsHtml}
    ${leadsHtml}
    <div style="margin-top:28px">
      ${btn(`${APP_URL}/dashboard`, '📊 Avaa dashboard')}
    </div>`;

  return { subject, html: emailWrapper(body, `Viikkoraportti ${weekLabel}: ${stats.views} näyttöä, ${stats.leads} liidiä`) };
}

// ─── 3. Tervetuloa ────────────────────────────────────────────────────────────

function buildWelcomeEmail(displayName) {
  const subject = `🎉 Tervetuloa UI Manageriin, ${(displayName || '').split(' ')[0]}!`;
  const body = `
    <h1 style="font-size:24px;font-weight:800;color:#0f172a;margin:0 0 8px">Tervetuloa mukaan! 👋</h1>
    <p style="font-size:14px;color:#475569;margin:0 0 24px;line-height:1.6">
      Tilisi on nyt aktivoitu. Voit aloittaa konversioelementtien luomisen heti.
    </p>

    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:20px;margin-bottom:24px">
      <div style="font-size:13px;font-weight:700;color:#15803d;margin-bottom:12px">✅ Näin pääset alkuun (3 askelta):</div>
      <div style="font-size:13px;color:#374151;margin-bottom:8px;line-height:1.6">
        <strong>1.</strong> Kirjaudu dashboardiin ja luo ensimmäinen elementti (Sticky Bar, Popup tms.)
      </div>
      <div style="font-size:13px;color:#374151;margin-bottom:8px;line-height:1.6">
        <strong>2.</strong> Kopioi asennuskoodi dashboardin <em>Asennuskoodi</em>-välilehdeltä
      </div>
      <div style="font-size:13px;color:#374151;line-height:1.6">
        <strong>3.</strong> Liitä koodi sivustosi &lt;head&gt;-osioon – elementit aktivoituvat välittömästi
      </div>
    </div>

    <div style="background:#1e293b;border-radius:8px;padding:14px 16px;font-family:monospace;font-size:12px;color:#e2e8f0;margin-bottom:24px">
      &lt;script src="${APP_URL}/ui-embed.js"<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; data-site="<span style="color:#86efac">SINUN_TOKEN</span>"&gt;&lt;/script&gt;
    </div>

    ${btn(`${APP_URL}/dashboard`, '🚀 Avaa dashboard')}`;

  return { subject, html: emailWrapper(body, 'Tilisi on aktivoitu – aloita käyttö nyt') };
}

// ─── 4. Testisähköposti ───────────────────────────────────────────────────────

function buildTestEmail(displayName) {
  const subject = `✅ Testisähköposti – ${BRAND}`;
  const body = `
    <h1 style="font-size:22px;font-weight:800;color:#0f172a;margin:0 0 12px">Sähköpostiasetukset toimivat! ✅</h1>
    <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 20px">
      Hei ${escHtml((displayName || '').split(' ')[0])}! Tämä on testisähköposti joka vahvistaa,
      että sähköposti-ilmoitukset on konfiguroitu oikein.
    </p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px 16px;font-size:13px;color:#15803d">
      <strong>✓ Liidi-ilmoitukset:</strong> Saat sähköpostin aina kun Lead Form -elementtiisi tulee uusi liidi.<br><br>
      <strong>✓ Viikkoraportti:</strong> Joka maanantai klo 8:00 saat yhteenvedon edellisen viikon suorituksesta.
    </div>
    ${btn(`${APP_URL}/dashboard#settings`, 'Hallitse asetuksia')}`;

  return { subject, html: emailWrapper(body) };
}

// ─── Apufunktiot ──────────────────────────────────────────────────────────────

function escHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

module.exports = {
  buildLeadNotification,
  buildWeeklyReport,
  buildWelcomeEmail,
  buildTestEmail
};
