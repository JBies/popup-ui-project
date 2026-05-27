// utils/scheduled-reports.js
// Ajastusmoottori — ajetaan 15 min välein schedulerista

const ReportSchedule = require('../models/ReportSchedule');
const User           = require('../models/User');
const { fetchReportData }   = require('./report-data');
const { buildReportEmail, parseDateRange } = require('../controllers/reports.controller');
const { sendMail }   = require('./email');

function resolveDataRange(dataRange) {
  const now = new Date();
  const ymd = d => new Date(d).toISOString().slice(0, 10);

  // Helsinki-ajan osat viikonpäivä- ja kuukausilaskentaan
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Helsinki',
    year: 'numeric', month: '2-digit', day: '2-digit',
    weekday: 'short',
  });
  const parts = fmt.formatToParts(now);
  const get = t => parts.find(p => p.type === t)?.value;
  const helYear    = Number(get('year'));
  const helMonth   = Number(get('month')) - 1; // 0-indeksoitu
  const helDay     = Number(get('day'));
  const weekdays   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const helWeekDay = weekdays.indexOf(get('weekday')); // 0=Su, 1=Ma...

  // Helsinki-kalenteripäivä UTC-midnightina (käytetään päiväaritmetiikassa)
  const helDateUTC = Date.UTC(helYear, helMonth, helDay);

  switch (dataRange) {
    case 'last90days':
      return { from: ymd(now - 90 * 864e5), to: ymd(now) };

    case 'lastWeek': {
      const day        = helWeekDay || 7; // 1=Ma ... 7=Su
      const thisMonday = helDateUTC - (day - 1) * 864e5;
      const lastMonday = thisMonday - 7 * 864e5;
      const lastSunday = thisMonday - 864e5;
      return { from: ymd(lastMonday), to: ymd(lastSunday) };
    }

    case 'lastMonth': {
      const first = Date.UTC(helYear, helMonth - 1, 1);
      const last  = Date.UTC(helYear, helMonth, 0);
      return { from: ymd(first), to: ymd(last) };
    }

    case 'lastYear': {
      const first = Date.UTC(helYear - 1, 0, 1);
      const last  = Date.UTC(helYear - 1, 11, 31);
      return { from: ymd(first), to: ymd(last) };
    }

    default:
      return { from: ymd(now - 7 * 864e5), to: ymd(now) };
  }
}

async function executeSchedule(schedule, now, isPreview = false) {
  if (!isPreview && schedule.lastSentAt) {
    const minsSinceLast = (now - new Date(schedule.lastSentAt)) / 60000;
    if (minsSinceLast < 30) {
      console.warn(`[scheduled-reports] VAROITUS: Aikataulu "${schedule.name}" lähetettiin ${Math.round(minsSinceLast)} min sitten — mahdollinen duplikaatti!`);
    }
  }

  const logEntry = { sentAt: now, success: false, error: null, recipientCount: 0, isPreview };

  try {
    const user = await User.findById(schedule.userId).lean();
    if (!user) throw new Error('Käyttäjää ei löydy');

    const { from, to } = resolveDataRange(schedule.dataRange);
    const { fromDate, toDate, fromStr, toStr } = parseDateRange(from, to);

    const popupFilter = { userId: schedule.userId };
    if (schedule.popupIds.length)     popupFilter._id    = { $in: schedule.popupIds };
    else if (schedule.siteIds.length) popupFilter.siteId = { $in: schedule.siteIds };

    const { period, allTime, topElements, recentLeads } = await fetchReportData(
      popupFilter, fromDate, toDate, fromStr, toStr,
      { leadLimit: 20, sortTopBy: 'leads' }
    );

    const fmt   = d => new Date(d).toLocaleDateString('fi-FI');
    const label = `${fmt(fromDate)}–${fmt(toDate)}`;

    const html = buildReportEmail(user, period, allTime, topElements, recentLeads, label, {
      clientName:   schedule.clientName   || '',
      introMessage: schedule.customIntroMessage || '',
    });

    const subject = schedule.customSubject
      ? schedule.customSubject
      : `📊 Raportti: ${label}${schedule.clientName ? ' – ' + schedule.clientName : ''}`;

    let allOk = true;
    const failed = [];
    for (const email of schedule.recipients) {
      const ok = await sendMail(email, subject, html);
      if (!ok) { allOk = false; failed.push(email); }
    }

    logEntry.success        = allOk;
    logEntry.recipientCount = schedule.recipients.length;
    if (!allOk) logEntry.error = `Lähetys epäonnistui: ${failed.join(', ')}`;
  } catch (err) {
    console.error(`[scheduled-reports] Virhe aikataulussa ${schedule._id}:`, err.message);
    logEntry.error = err.message;
  }

  // Päivitä aikataulu — preview ei päivitä lastSentAt/nextSendAt
  const { computeNextSendAt } = ReportSchedule;
  if (isPreview) {
    await ReportSchedule.findByIdAndUpdate(schedule._id, {
      $push: { deliveryLog: { $each: [logEntry], $slice: -10 } },
    });
  } else {
    const nextSendAt = computeNextSendAt(schedule, now);
    await ReportSchedule.findByIdAndUpdate(schedule._id, {
      $set:  { lastSentAt: now, nextSendAt },
      $push: { deliveryLog: { $each: [logEntry], $slice: -10 } },
    });
  }

  return logEntry;
}

async function runScheduledReports() {
  const now       = new Date();
  const lockUntil = new Date(now.getTime() + 10 * 60 * 1000); // 10 min väliaikaislukko

  // Atominen claim: findOneAndUpdate siirtää nextSendAt tulevaisuuteen ennen ajoa,
  // joten kaksi samanaikaista prosessia ei voi koskaan ottaa samaa aikataulua käsittelyyn.
  let processed = 0;
  while (true) {
    const schedule = await ReportSchedule.findOneAndUpdate(
      { active: true, nextSendAt: { $lte: now } },
      { $set: { nextSendAt: lockUntil } },
      { new: false } // palauta dokumentti ennen muutosta (tarvitaan oikeat kentät executeSchedule:lle)
    ).lean();

    if (!schedule) break;

    console.log(`[scheduled-reports] Ajetaan: "${schedule.name}" (${schedule._id})`);
    await executeSchedule(schedule, now); // asettaa oikean nextSendAt lopussa
    processed++;
  }

  if (processed > 0) {
    console.log(`[scheduled-reports] Ajettiin ${processed} aikataulua ${now.toISOString()}`);
  }
}

module.exports = { runScheduledReports, executeSchedule, resolveDataRange };
