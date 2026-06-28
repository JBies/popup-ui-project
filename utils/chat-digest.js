// utils/chat-digest.js
// Päivittäinen chatbot-kooste: lähettää käyttäjälle yhteenvedon edellisen
// vuorokauden chat-keskusteluista — mutta vain jos botille on juteltu.

const User        = require('../models/User');
const ChatBot     = require('../models/ChatBot');
const ChatSession = require('../models/ChatSession');
const ChatMessage = require('../models/ChatMessage');
const { sendMail } = require('./email');

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Rakentaa yhden käyttäjän koosteen HTML:n.
 */
function buildDigestHtml({ displayName, since, until, bots, totals, samples }) {
  const fmtDate = (d) => d.toLocaleDateString('fi-FI', { day: 'numeric', month: 'numeric', year: 'numeric' });
  const period  = `${fmtDate(since)} – ${fmtDate(until)}`;

  const botRows = bots.map(b => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#1e293b">${esc(b.name)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#1e293b;text-align:center">${b.sessions}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#1e293b;text-align:center">${b.userMessages}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#1e293b;text-align:center">${b.leads}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:${b.fallbacks > 0 ? '#dc2626' : '#16a34a'};text-align:center">${b.fallbacks}</td>
    </tr>`).join('');

  const sampleBlocks = samples.map(s => `
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px;margin-bottom:10px">
      <div style="font-size:11px;color:#94a3b8;margin-bottom:6px">${esc(s.botName)} · ${new Date(s.createdAt).toLocaleString('fi-FI', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}</div>
      ${s.messages.map(m => `
        <div style="margin-bottom:6px;display:flex;gap:8px;align-items:flex-start">
          <span style="padding:2px 8px;border-radius:99px;font-size:10px;font-weight:600;white-space:nowrap;background:${m.role==='user'?'#dbeafe':'#f1f5f9'};color:${m.role==='user'?'#1d4ed8':'#374151'}">${m.role==='user'?'Kävijä':'Botti'}</span>
          <span style="font-size:12px;line-height:1.5;color:#374151">${esc(m.content)}</span>
        </div>`).join('')}
    </div>`).join('');

  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:640px;margin:0 auto;color:#1e293b">
    <div style="background:linear-gradient(135deg,#2563EB,#7c3aed);border-radius:14px;padding:24px;color:#fff;margin-bottom:20px">
      <div style="font-size:20px;font-weight:800">🤖 Päivittäinen chatbot-kooste</div>
      <div style="font-size:13px;opacity:0.9;margin-top:4px">${period}</div>
    </div>

    <p style="font-size:14px;color:#334155">Hei ${esc(displayName)}, chatbotillesi juteltiin tänä aikana. Tässä yhteenveto:</p>

    <div style="display:flex;gap:10px;flex-wrap:wrap;margin:16px 0">
      ${[
        ['💬', 'Keskustelua', totals.sessions, '#2563EB'],
        ['✍️', 'Kävijän viestiä', totals.userMessages, '#7c3aed'],
        ['📋', 'Liidiä', totals.leads, '#16a34a'],
        ['❓', 'Ei vastausta', totals.fallbacks, totals.fallbacks > 0 ? '#dc2626' : '#16a34a'],
      ].map(([icon, label, val, color]) => `
        <div style="flex:1;min-width:120px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:14px">
          <div style="font-size:20px">${icon}</div>
          <div style="font-size:22px;font-weight:800;color:${color};line-height:1.1">${val}</div>
          <div style="font-size:11px;color:#64748b;margin-top:2px">${label}</div>
        </div>`).join('')}
    </div>

    <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#fff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">
      <thead>
        <tr style="background:#f8fafc">
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b;font-weight:600">Botti</th>
          <th style="padding:8px 12px;text-align:center;font-size:11px;color:#64748b;font-weight:600">Keskustelut</th>
          <th style="padding:8px 12px;text-align:center;font-size:11px;color:#64748b;font-weight:600">Viestit</th>
          <th style="padding:8px 12px;text-align:center;font-size:11px;color:#64748b;font-weight:600">Liidit</th>
          <th style="padding:8px 12px;text-align:center;font-size:11px;color:#64748b;font-weight:600">Ei vastausta</th>
        </tr>
      </thead>
      <tbody>${botRows}</tbody>
    </table>

    ${totals.fallbacks > 0 ? `
      <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;padding:12px 14px;font-size:13px;color:#92400e;margin-bottom:16px">
        💡 Botti ei löytänyt vastausta ${totals.fallbacks} kertaa. Avaa dashboardin <strong>Logit</strong>-välilehti ja käytä <strong>"Muokkaa &amp; opeta"</strong> opettaaksesi oikeat vastaukset.
      </div>` : ''}

    ${sampleBlocks ? `
      <div style="font-size:13px;font-weight:700;color:#1e293b;margin:18px 0 10px">Viimeisimmät keskustelut</div>
      ${sampleBlocks}` : ''}

    <p style="font-size:12px;color:#94a3b8;margin-top:20px">
      Saat tämän koosteen kerran päivässä silloin kun botillesi on juteltu. Voit poistaa sen käytöstä dashboardin sähköposti-ilmoituksista.
    </p>
  </div>`;
}

/**
 * Lähettää päivittäisen koosteen kaikille käyttäjille joilla oli chat-toimintaa.
 * @param {number} hoursBack  Aikaikkuna tunteina (oletus 24)
 */
async function sendDailyChatDigests(hoursBack = 24) {
  const until = new Date();
  const since = new Date(until.getTime() - hoursBack * 60 * 60 * 1000);

  // Käyttäjät joilla on vähintään yksi botti ja kooste päällä
  const users = await User.find({
    'emailNotifications.chatDailyDigest': { $ne: false },
    'chatbotLimits.maxBots': { $gt: 0 }
  }).select('email displayName emailNotifications chatbotLimits').lean();

  let sent = 0;

  for (const user of users) {
    try {
      const bots = await ChatBot.find({ userId: user._id }).select('name').lean();
      if (bots.length === 0) continue;
      const botIds   = bots.map(b => b._id);
      const botNames = new Map(bots.map(b => [String(b._id), b.name || 'Chatbot']));

      // Keskustelut (sessiot) aikaikkunassa
      // Huom: playground-testit (pageUrl='playground') otetaan mukaan, jotta koosteen
      // toiminnan näkee jo ennen kuin botti on livenä sivustolla.
      const sessions = await ChatSession.find({
        botId: { $in: botIds },
        createdAt: { $gte: since, $lte: until }
      }).sort({ createdAt: -1 }).lean();

      // Viestit aikaikkunassa (sis. playground-testit)
      const messages = await ChatMessage.find({
        botId: { $in: botIds },
        createdAt: { $gte: since, $lte: until }
      }).select('botId sessionId role content matchType createdAt').lean();

      const userMessages = messages.filter(m => m.role === 'user');
      // Ei lähetetä jos botille ei ole oikeasti juteltu
      if (userMessages.length === 0) continue;

      // Per-botti -tilastot
      const perBot = new Map();
      for (const b of bots) perBot.set(String(b._id), { name: b.name || 'Chatbot', sessions: 0, userMessages: 0, leads: 0, fallbacks: 0 });
      for (const s of sessions) {
        const e = perBot.get(String(s.botId)); if (e) { e.sessions++; if (s.hasLead) e.leads++; }
      }
      for (const m of messages) {
        const e = perBot.get(String(m.botId)); if (!e) continue;
        if (m.role === 'user') e.userMessages++;
        if (m.role === 'assistant' && m.matchType === 'fallback') e.fallbacks++;
      }
      // Vain botit joilla oli toimintaa
      const activeBots = [...perBot.values()].filter(b => b.userMessages > 0 || b.sessions > 0);

      const totals = {
        sessions:     sessions.length,
        userMessages: userMessages.length,
        leads:        sessions.filter(s => s.hasLead).length,
        fallbacks:    messages.filter(m => m.role === 'assistant' && m.matchType === 'fallback').length
      };

      // Näytteet: enintään 3 viimeisintä keskustelua, kustakin enintään 6 viestiä
      const msgsBySession = new Map();
      for (const m of messages) {
        if (!msgsBySession.has(m.sessionId)) msgsBySession.set(m.sessionId, []);
        msgsBySession.get(m.sessionId).push(m);
      }
      const samples = sessions.slice(0, 3).map(s => {
        const ms = (msgsBySession.get(s.sessionId) || [])
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
          .slice(0, 6)
          .map(m => ({ role: m.role, content: (m.content || '').slice(0, 300) }));
        return { botName: botNames.get(String(s.botId)) || 'Chatbot', createdAt: s.createdAt, messages: ms };
      }).filter(s => s.messages.length > 0);

      const html = buildDigestHtml({
        displayName: user.displayName || '',
        since, until,
        bots: activeBots,
        totals,
        samples
      });

      const to = user.emailNotifications?.notifyEmail?.trim() || user.email;
      const ok = await sendMail(to, `🤖 Chatbot-kooste: ${totals.userMessages} viestiä, ${totals.sessions} keskustelua`, html);
      if (ok) sent++;
    } catch (err) {
      console.error('[chat-digest] Käyttäjän', String(user._id), 'kooste epäonnistui:', err.message);
    }
  }

  console.log(`[chat-digest] Päivittäinen kooste lähetetty ${sent} käyttäjälle.`);
  return sent;
}

module.exports = { sendDailyChatDigests };
