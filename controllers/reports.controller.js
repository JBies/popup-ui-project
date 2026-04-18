// controllers/reports.controller.js
// Raporttidata dashboardiin ja sähköpostilähetykseen

const Popup      = require('../models/Popup');
const Lead       = require('../models/Lead');
const DailyStats = require('../models/DailyStats');
const { sendMail } = require('../utils/email');

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

    // Rakenna popup-suodatin
    const popupFilter = { userId };
    if (popupId) popupFilter._id = popupId;
    if (siteId === '_none') popupFilter.siteId = null;
    else if (siteId) popupFilter.siteId = siteId;

    // Hae sopivat popupit (tarvitaan id-lista ja all-time summat)
    const popups = await Popup.find(popupFilter)
      .select('_id name elementType statistics siteId')
      .lean();
    const popupIds = popups.map(p => p._id);

    if (!popupIds.length) {
      return res.json({
        period:   { views: 0, clicks: 0, leads: 0 },
        allTime:  { views: 0, clicks: 0, leads: 0 },
        topElements: [],
        recentLeads: [],
      });
    }

    // ── Jaksokohtaiset tilastot ────────────────────────────────────────────────
    const [dailyAgg, periodLeads] = await Promise.all([
      // Views + clicks DailyStats-kokoelmasta
      DailyStats.aggregate([
        { $match: { popupId: { $in: popupIds }, date: { $gte: fromStr, $lte: toStr } } },
        { $group: { _id: null, views: { $sum: '$views' }, clicks: { $sum: '$clicks' } } },
      ]),
      // Liidit Lead-mallista
      Lead.countDocuments({ userId, popupId: { $in: popupIds }, submittedAt: { $gte: fromDate, $lte: toDate } }),
    ]);

    const period = {
      views:  dailyAgg[0]?.views  || 0,
      clicks: dailyAgg[0]?.clicks || 0,
      leads:  periodLeads,
    };

    // ── Kaikki-aikainen summa ─────────────────────────────────────────────────
    const allTime = popups.reduce((acc, p) => {
      acc.views  += p.statistics?.views  || 0;
      acc.clicks += p.statistics?.clicks || 0;
      acc.leads  += p.statistics?.leads  || 0;
      return acc;
    }, { views: 0, clicks: 0, leads: 0 });

    // ── Top-elementit: käytetään kumulatiivista Popup.statistics-dataa ────────
    // DailyStats on uusi → ei historiadataa vanhemmilta jaksoilta.
    // Kumulatiivinen data on aina saatavilla ja kertoo elementin kokonaissuorituksen.
    const topElements = popups
      .map(p => ({
        _id:    p._id,
        name:   p.name || 'Nimetön',
        type:   p.elementType || 'popup',
        siteId: p.siteId || null,
        views:  p.statistics?.views  || 0,
        clicks: p.statistics?.clicks || 0,
        leads:  p.statistics?.leads  || 0,
      }))
      .sort((a, b) => b.leads - a.leads || b.clicks - a.clicks || b.views - a.views)
      .slice(0, 5);

    // ── Viimeisimmät liidit jaksolla ──────────────────────────────────────────
    const recentLeadsRaw = await Lead
      .find({ userId, popupId: { $in: popupIds }, submittedAt: { $gte: fromDate, $lte: toDate } })
      .sort({ submittedAt: -1 })
      .limit(50)
      .populate('popupId', 'name elementType siteId')
      .lean();

    const recentLeads = recentLeadsRaw.map(l => ({
      popupName:   l.popupId?.name || 'Tuntematon',
      elementType: l.popupId?.elementType || null,
      siteId:      l.popupId?.siteId || null,
      data:        l.data || {},
      submittedAt: l.submittedAt,
    }));

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

    // Hae data (sama logiikka kuin getReport)
    const popupFilter = { userId };
    if (popupId) popupFilter._id = popupId;
    if (siteId === '_none') popupFilter.siteId = null;
    else if (siteId) popupFilter.siteId = siteId;

    const popups = await Popup.find(popupFilter).select('_id name elementType statistics siteId').lean();
    const popupIds = popups.map(p => p._id);

    const [dailyAgg, periodLeads, recentLeadsRaw] = await Promise.all([
      DailyStats.aggregate([
        { $match: { popupId: { $in: popupIds }, date: { $gte: fromStr, $lte: toStr } } },
        { $group: { _id: null, views: { $sum: '$views' }, clicks: { $sum: '$clicks' } } },
      ]),
      Lead.countDocuments({ userId, popupId: { $in: popupIds }, submittedAt: { $gte: fromDate, $lte: toDate } }),
      Lead.find({ userId, popupId: { $in: popupIds }, submittedAt: { $gte: fromDate, $lte: toDate } })
        .sort({ submittedAt: -1 }).limit(10).populate('popupId', 'name elementType siteId').lean(),
    ]);

    const period  = { views: dailyAgg[0]?.views || 0, clicks: dailyAgg[0]?.clicks || 0, leads: periodLeads };
    const allTime = popups.reduce((a, p) => {
      a.views  += p.statistics?.views  || 0;
      a.clicks += p.statistics?.clicks || 0;
      a.leads  += p.statistics?.leads  || 0;
      return a;
    }, { views: 0, clicks: 0, leads: 0 });

    const recentLeads = recentLeadsRaw.map(l => ({
      popupName: l.popupId?.name || 'Tuntematon',
      data: l.data || {},
      submittedAt: l.submittedAt,
    }));

    // Muodosta aikaväli-label
    const fmt = d => new Date(d).toLocaleDateString('fi-FI');
    const label = from && to ? `${fmt(fromDate)}–${fmt(toDate)}` : from ? `${fmt(fromDate)} alkaen` : 'Kaikki aika';

    // Rakenna HTML-sähköposti
    const html = buildReportEmail(req.user, period, allTime, recentLeads, label);
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

function buildReportEmail(user, period, allTime, leads, label) {
  const name = (user.displayName || 'Hei').split(' ')[0];

  const statCell = (icon, val, label, bg = '#f8fafc') => `
    <td style="text-align:center;padding:14px 8px;background:${bg};border-radius:10px">
      <div style="font-size:20px;margin-bottom:2px">${icon}</div>
      <div style="font-size:24px;font-weight:800;color:#0f172a">${val}</div>
      <div style="font-size:11px;color:#64748b;margin-top:2px">${label}</div>
    </td>`;

  const leadsHtml = leads.length
    ? `<div style="margin-top:24px">
        <div style="font-size:14px;font-weight:700;color:#0f172a;margin-bottom:10px">📋 Viimeisimmät liidit (${leads.length} kpl)</div>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
          ${leads.map(l => {
            const preview = Object.values(l.data || {}).filter(Boolean).slice(0,2).join(' · ') || '(tyhjä)';
            return `<tr>
              <td style="padding:7px 10px;border-bottom:1px solid #f1f5f9;font-size:12px;color:#374151">${esc(preview)}</td>
              <td style="padding:7px 10px;border-bottom:1px solid #f1f5f9;font-size:11px;color:#94a3b8;white-space:nowrap">${new Date(l.submittedAt).toLocaleDateString('fi-FI')}</td>
            </tr>`;
          }).join('')}
        </table>
      </div>` : '';

  const body = `
    <p style="font-size:15px;color:#374151;margin:0 0 20px">Hei ${esc(name)}! Tässä raporttisi ajalta <strong>${esc(label)}</strong>.</p>

    <div style="font-size:13px;font-weight:700;color:#64748b;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em">Valittu aikaväli</div>
    <table width="100%" cellpadding="6" cellspacing="0" style="margin-bottom:20px">
      <tr>
        ${statCell('👁️', period.views,  'Näyttöä')}
        <td width="8"></td>
        ${statCell('🖱️', period.clicks, 'Klikkausta')}
        <td width="8"></td>
        ${statCell('📋', period.leads,  'Liidiä')}
      </tr>
    </table>

    <div style="font-size:13px;font-weight:700;color:#64748b;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em">Kaikki aika yhteensä</div>
    <table width="100%" cellpadding="6" cellspacing="0" style="margin-bottom:8px">
      <tr>
        ${statCell('👁️', allTime.views,  'Näyttöä yhteensä', '#f1f5f9')}
        <td width="8"></td>
        ${statCell('🖱️', allTime.clicks, 'Klikkausta yhteensä', '#f1f5f9')}
        <td width="8"></td>
        ${statCell('📋', allTime.leads,  'Liidiä yhteensä', '#f1f5f9')}
      </tr>
    </table>

    ${leadsHtml}

    <div style="margin-top:24px">
      <a href="${process.env.APP_URL || 'https://popupmanager.net'}/dashboard#reports"
        style="display:inline-block;background:#1e40af;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600">
        📊 Avaa Raportit-sivu →
      </a>
    </div>`;

  // Minimal email wrapper
  return `<!DOCTYPE html><html lang="fi"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
        <tr><td style="background:#1e40af;border-radius:12px 12px 0 0;padding:20px 32px;text-align:center">
          <span style="color:#fff;font-size:20px;font-weight:700">UI Manager</span>
        </td></tr>
        <tr><td style="background:#fff;border-radius:0 0 12px 12px;padding:32px;border:1px solid #e2e8f0;border-top:none">
          ${body}
        </td></tr>
        <tr><td style="padding:20px 0;text-align:center;font-size:12px;color:#94a3b8">
          UI Manager · <a href="${process.env.APP_URL || 'https://popupmanager.net'}/dashboard#settings" style="color:#94a3b8">Hallitse ilmoituksia</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
