// controllers/reports.controller.js
// Raporttidata dashboardiin ja sähköpostilähetykseen

const Popup       = require('../models/Popup');
const Lead        = require('../models/Lead');
const DailyStats  = require('../models/DailyStats');
const PageElement = require('../models/PageElement');
const ScrollStats = require('../models/ScrollStats');
const { sendMail }       = require('../utils/email');
const { fetchReportData } = require('../utils/report-data');

// Rate limiting: max 3 raporttisähköpostia tunnissa per käyttäjä
const emailCooldown = new Map();

/**
 * Muodostaa from/to -päivämäärärajat kyselyä varten.
 * Palauttaa { fromDate: Date, toDate: Date, fromStr: string, toStr: string }
 */
function parseDateRange(fromQ, toQ) {
  const toDate  = toQ   ? new Date(toQ   + 'T23:59:59.999Z') : new Date();
  const fromDate = fromQ ? new Date(fromQ + 'T00:00:00.000Z') : new Date(0);
  const toStr   = toDate.toISOString().slice(0, 10);
  const fromStr = fromDate.toISOString().slice(0, 10);
  return { fromDate, toDate, fromStr, toStr };
}

/**
 * GET /api/reports
 * Query: from, to, popupId, siteId
 */
exports.getReport = async (req, res) => {
  try {
    const userId = req.user._id;
    const { fromDate, toDate, fromStr, toStr } = parseDateRange(req.query.from, req.query.to);
    const { popupId, siteId } = req.query;

    const popupFilter = { userId };
    if (popupId) popupFilter._id = popupId;
    if (siteId === '_none') popupFilter.siteId = null;
    else if (siteId) popupFilter.siteId = siteId;

    // Sivuelementtien klikit haetaan erikseen (ei osana fetchReportData)
    const popups = await Popup.find(popupFilter).select('_id').lean();
    const popupIds = popups.map(p => p._id);
    const pageElementsAgg = popupIds.length
      ? await PageElement.aggregate([
          { $match: { popupId: { $in: popupIds } } },
          { $group: { _id: null, totalClicks: { $sum: '$clicks' } } },
        ])
      : [];

    const { period, allTime, topElements, recentLeads } = await fetchReportData(
      popupFilter, fromDate, toDate, fromStr, toStr,
      { leadLimit: 50, sortTopBy: 'leads' }
    );

    period.pageElementsClicks = pageElementsAgg[0]?.totalClicks || 0;

    res.json({ period, allTime, topElements, recentLeads });
  } catch (err) {
    console.error('[reports] getReport error:', err);
    res.status(500).json({ message: 'Raportin haku epäonnistui', error: err.message });
  }
};

/**
 * POST /api/reports/email
 * Body: { from, to, popupId, siteId }
 */
exports.emailReport = async (req, res) => {
  try {
    const userId = req.user._id;
    const key    = String(userId);

    // Rate limit: max 3 per tunti
    const record = emailCooldown.get(key) || { count: 0, reset: Date.now() + 3600000 };
    if (Date.now() > record.reset) { record.count = 0; record.reset = Date.now() + 3600000; }
    if (record.count >= 3) {
      const minLeft = Math.ceil((record.reset - Date.now()) / 60000);
      return res.status(429).json({ message: `Odota ${minLeft} min ennen uutta raporttia.` });
    }
    record.count++;
    emailCooldown.set(key, record);

    const { from, to, popupId, siteId } = req.body;
    const { fromDate, toDate, fromStr, toStr } = parseDateRange(from, to);

    const popupFilter = { userId };
    if (popupId) popupFilter._id = popupId;
    if (siteId === '_none') popupFilter.siteId = null;
    else if (siteId) popupFilter.siteId = siteId;

    const { period, allTime, topElements, recentLeads } = await fetchReportData(
      popupFilter, fromDate, toDate, fromStr, toStr,
      { leadLimit: 20, sortTopBy: 'views' }
    );

    const fmt = d => new Date(d).toLocaleDateString('fi-FI');
    const label = from && to ? `${fmt(fromDate)}–${fmt(toDate)}` : from ? `${fmt(fromDate)} alkaen` : 'Kaikki aika';

    const html = buildReportEmail(req.user, period, allTime, topElements, recentLeads, label);
    const subject = `📊 Raportti: ${label} – UI Manager`;

    const toEmail = req.user.emailNotifications?.notifyEmail?.trim() || req.user.email;
    const ok = await sendMail(toEmail, subject, html);
    if (!ok) throw new Error('Sähköpostin lähetys epäonnistui');

    res.json({ ok: true, to: toEmail });
  } catch (err) {
    console.error('[reports] emailReport error:', err);
    res.status(500).json({ message: err.message || 'Lähetys epäonnistui' });
  }
};

// ─── HTML-sähköpostipohja ─────────────────────────────────────────────────────

function esc(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

const TYPE_LABELS_EMAIL = {
  sticky_bar: 'Sticky Bar', fab: 'Floating Button', slide_in: 'Slide-in',
  popup: 'Popup', lead_form: 'Lead Form', stats_only: 'Tilastojen kerääjä',
};
const TYPE_ICONS_EMAIL = {
  sticky_bar: '📌', fab: '🔘', slide_in: '💬', popup: '⬜', lead_form: '📝', stats_only: '📊',
};

function buildReportEmail(user, period, allTime, topElements, leads, label, opts = {}) {
  const name = opts.clientName || (user.displayName || 'Hei').split(' ')[0];
  const periodCtr = period.views > 0 ? ((period.clicks / period.views) * 100).toFixed(1) : '0.0';
  const allCtr    = allTime.views  > 0 ? ((allTime.clicks  / allTime.views)  * 100).toFixed(1) : '0.0';

  const statCell = (icon, val, lbl, bg = '#f8fafc') => `
    <td style="text-align:center;padding:14px 8px;background:${bg};border-radius:10px">
      <div style="font-size:20px;margin-bottom:2px">${icon}</div>
      <div style="font-size:24px;font-weight:800;color:#0f172a">${val}</div>
      <div style="font-size:11px;color:#64748b;margin-top:2px">${lbl}</div>
    </td>`;

  // Top elementit -osio
  const topElsHtml = topElements.length
    ? `<div style="margin-top:28px">
        <div style="font-size:14px;font-weight:700;color:#0f172a;margin-bottom:12px">📊 Elementit (${topElements.length} kpl) – ${esc(label)}</div>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:12px">
          <tr style="background:#f8fafc">
            <th style="padding:8px 10px;text-align:left;color:#64748b;font-weight:600">Elementti</th>
            <th style="padding:8px 6px;text-align:right;color:#64748b;font-weight:600">Näytöt</th>
            <th style="padding:8px 6px;text-align:right;color:#64748b;font-weight:600">Klikkaukset</th>
            <th style="padding:8px 6px;text-align:right;color:#64748b;font-weight:600">CTR</th>
            <th style="padding:8px 10px;text-align:right;color:#64748b;font-weight:600">Liidit</th>
          </tr>
          ${topElements.map((el, i) => {
            const isStats = el.type === 'stats_only';
            const elCtr = el.views > 0 ? ((el.clicks / el.views) * 100).toFixed(1) : '0.0';
            const typeLabel = TYPE_LABELS_EMAIL[el.type] || el.type;
            return `<tr style="border-top:1px solid #f1f5f9;background:${i%2===1?'#fafbfc':'#fff'}">
              <td style="padding:9px 10px">
                <div style="font-weight:600;color:#0f172a">${esc(el.name)}</div>
                <div style="font-size:11px;color:#94a3b8;margin-top:1px">${typeLabel}</div>
              </td>
              <td style="padding:9px 6px;text-align:right;color:#374151">${el.views.toLocaleString('fi-FI')}</td>
              <td style="padding:9px 6px;text-align:right;color:#64748b">${isStats ? '–' : el.clicks.toLocaleString('fi-FI')}</td>
              <td style="padding:9px 6px;text-align:right;color:${isStats?'#94a3b8':parseFloat(elCtr)>5?'#16a34a':'#64748b'}">${isStats ? '–' : elCtr+'%'}</td>
              <td style="padding:9px 10px;text-align:right;font-weight:700;color:${isStats?'#94a3b8':'#1d4ed8'}">${isStats ? '–' : el.leads}</td>
            </tr>`;
          }).join('')}
        </table>
      </div>` : '';

  // Liidit-osio eriteltynä
  const leadsHtml = leads.length
    ? `<div style="margin-top:28px">
        <div style="font-size:14px;font-weight:700;color:#0f172a;margin-bottom:10px">📋 Liidit jaksolla (${leads.length} kpl)</div>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
          ${leads.map(l => {
            const icon = TYPE_ICONS_EMAIL[l.elementType] || '◻';
            const typeLabel = TYPE_LABELS_EMAIL[l.elementType] || (l.elementType || '');
            const entries = Object.entries(l.data || {}).filter(([, v]) => v);
            const preview = entries.slice(0, 3).map(([k, v]) => `<span style="color:#64748b">${esc(k)}:</span> ${esc(String(v))}`).join(' &nbsp;·&nbsp; ') || '(tyhjä)';
            return `<tr style="border-top:1px solid #f1f5f9">
              <td style="padding:9px 10px">
                <div style="font-size:11px;color:#94a3b8;margin-bottom:2px">${icon} ${esc(l.popupName)}${typeLabel ? ' · '+typeLabel : ''}</div>
                <div style="font-size:12px;color:#0f172a">${preview}</div>
              </td>
              <td style="padding:9px 10px;font-size:11px;color:#94a3b8;white-space:nowrap;vertical-align:top;text-align:right">${new Date(l.submittedAt).toLocaleDateString('fi-FI')}</td>
            </tr>`;
          }).join('')}
        </table>
      </div>` : `
    <div style="margin-top:28px;padding:16px;background:#f8fafc;border-radius:8px;font-size:13px;color:#94a3b8;text-align:center">
      Ei liidejä valitulla ajanjaksolla.
    </div>`;

  const introHtml = opts.introMessage
    ? `<p style="font-size:14px;color:#374151;margin:0 0 16px;padding:12px 16px;background:#f8fafc;border-radius:8px;border-left:3px solid #1e40af">${esc(opts.introMessage)}</p>`
    : '';

  const body = `
    <p style="font-size:15px;color:#374151;margin:0 0 20px">Hei ${esc(name)}! Tässä raporttisi ajalta <strong>${esc(label)}</strong>.</p>
    ${introHtml}

    <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:8px">Valittu aikaväli</div>
    <table width="100%" cellpadding="6" cellspacing="0" style="margin-bottom:20px">
      <tr>
        ${statCell('👁️', period.views.toLocaleString('fi-FI'),  'Näyttöä')}
        <td width="6"></td>
        ${statCell('🖱️', period.clicks.toLocaleString('fi-FI'), 'Klikkausta')}
        <td width="6"></td>
        ${statCell('📈', periodCtr + '%', 'CTR')}
        <td width="6"></td>
        ${statCell('📋', period.leads,  'Liidiä')}
      </tr>
    </table>

    ${topElsHtml}
    ${leadsHtml}

    <div style="margin-top:28px;border-top:1px solid #f1f5f9;padding-top:20px">
      <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:8px">Kaikki aika yhteensä</div>
      <table width="100%" cellpadding="6" cellspacing="0" style="margin-bottom:8px">
        <tr>
          ${statCell('👁️', allTime.views.toLocaleString('fi-FI'),  'Näyttöä', '#f1f5f9')}
          <td width="6"></td>
          ${statCell('🖱️', allTime.clicks.toLocaleString('fi-FI'), 'Klikkausta', '#f1f5f9')}
          <td width="6"></td>
          ${statCell('📈', allCtr + '%', 'CTR', '#f1f5f9')}
          <td width="6"></td>
          ${statCell('📋', allTime.leads, 'Liidiä', '#f1f5f9')}
        </tr>
        ${allTime.scrollSessions > 0 ? `
        <tr><td colspan="4" style="padding:4px"></td></tr>
        <tr>
          ${statCell('📊', allTime.scrollSessions.toLocaleString('fi-FI'), 'Vierityskertaa', '#f0fdf4')}
          <td width="6"></td>
          ${statCell('📏', allTime.scrollAvgDepth + '%', 'Keskisyvyys', '#f0fdf4')}
          <td width="6"></td>
          <td></td>
          <td width="6"></td>
          <td></td>
        </tr>` : ''}
      </table>
    </div>

`;

  const APP_URL = process.env.APP_URL || 'https://popupmanager.net';
  return `<!DOCTYPE html><html lang="fi"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
        <tr><td style="background:#1e40af;border-radius:12px 12px 0 0;padding:20px 32px;text-align:center">
          <span style="color:#fff;font-size:20px;font-weight:700">${opts.clientName ? esc(opts.clientName) + ' · ' : ''}UI Manager</span>
        </td></tr>
        <tr><td style="background:#fff;border-radius:0 0 12px 12px;padding:32px;border:1px solid #e2e8f0;border-top:none">
          ${body}
        </td></tr>
        <tr><td style="padding:20px 0;text-align:center;font-size:12px;color:#94a3b8">
          UI Manager · <a href="${APP_URL}/dashboard#settings" style="color:#94a3b8">Hallitse ilmoituksia</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

exports.buildReportEmail = buildReportEmail;
exports.parseDateRange   = parseDateRange;
