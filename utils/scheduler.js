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

  console.log('[scheduler] Ajastimet käynnistetty (viikkoraportti: ma 08:00 Helsinki)');
}

module.exports = { initScheduler };
