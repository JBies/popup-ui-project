// utils/scheduler.js
// Ajoitetut tehtävät node-cron -kirjastolla

const cron = require('node-cron');

let initialized = false;

function initScheduler() {
  if (initialized) return;
  initialized = true;

  // ── Viikkoraportti: joka maanantai klo 08:00 Suomen aikaa ──────────────────
  // Cron-syntaksi: s m h d M dow
  cron.schedule('0 8 * * 1', async () => {
    console.log('[scheduler] Käynnistetään viikkoraportti...');
    try {
      // Ladataan laiskasti – vältytään sirkulaririippuvuudelta käynnistysvaiheessa
      const { sendWeeklyReports } = require('./weekly-report');
      await sendWeeklyReports();
    } catch (err) {
      console.error('[scheduler] Viikkoraportti epäonnistui:', err.message);
    }
  }, { timezone: 'Europe/Helsinki' });

  // ── Automatisoidut raportit: 15 min välein ────────────────────────────────
  cron.schedule('*/15 * * * *', async () => {
    try {
      const { runScheduledReports } = require('./scheduled-reports');
      await runScheduledReports();
    } catch (err) {
      console.error('[scheduler] Automatisoidut raportit epäonnistuivat:', err.message);
    }
  }, { timezone: 'Europe/Helsinki' });

  // ── Päivittäinen chatbot-kooste: joka päivä klo 07:00 (vain jos keskusteluja) ──
  cron.schedule('0 7 * * *', async () => {
    console.log('[scheduler] Käynnistetään päivittäinen chatbot-kooste...');
    try {
      const { sendDailyChatDigests } = require('./chat-digest');
      await sendDailyChatDigests(24);
    } catch (err) {
      console.error('[scheduler] Chatbot-kooste epäonnistui:', err.message);
    }
  }, { timezone: 'Europe/Helsinki' });

  console.log('[scheduler] Ajastimet käynnistetty (viikkoraportti: ma 08:00, chatbot-kooste: pä 07:00, automaattiset raportit: 15 min välein)');
}

module.exports = { initScheduler };
