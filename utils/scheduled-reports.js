// utils/scheduled-reports.js
// Ajastusmoottori — ajetaan 15 min välein schedulerista

const ReportSchedule = require('../models/ReportSchedule');
const User           = require('../models/User');
const { fetchReportData }   = require('./report-data');
const { buildReportEmail, parseDateRange } = require('../controllers/reports.controller');
const { sendMail }   = require('./email');

function resolveDataRange(dataRange) {
  const now = new Date();
  const ymd = d => d.toISOString().slice(0, 10);

  switch (dataRange) {
    case 'last90days': return { from: ymd(new Date(now - 90 * 864e5)), to: ymd(now) };
    case 'lastWeek': {
      const day = now.getDay() || 7;
      const thisMonday = new Date(now); thisMonday.setDate(now.getDate() - day + 1);
      const lastMonday = new Date(thisMonday); lastMonday.setDate(thisMonday.getDate() - 7);
      const lastSunday = new Date(thisMonday); lastSunday.setDate(thisMonday.getDate() - 1);
      return { from: ymd(lastMonday), to: ymd(lastSunday) };
    }
    case 'lastMonth': {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const last  = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: ymd(first), to: ymd(last) };
    }
    case 'lastYear': {
      const first = new Date(now.getFullYear() - 1, 0, 1);
      const last  = new Date(now.getFullYear() - 1, 11, 31);
      return { from: ymd(first), to: ymd(last) };
    }
    default: return { from: ymd(new Date(now - 7 * 864e5)), to: ymd(now) };
  }
}

async function executeSchedule(schedule, now, isPreview = false) {
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
  const now = new Date();

  // Diagnostiikka: laske kaikki aktiiviset, ei vain erääntyneet
  const [due, totalActive] = await Promise.all([
    ReportSchedule.find({ active: true, nextSendAt: { $lte: now } }).lean(),
    ReportSchedule.countDocuments({ active: true }),
  ]);

  if (totalActive > 0) {
    console.log(`[scheduled-reports] Tarkistus ${now.toISOString()} — aktiivisia: ${totalActive}, erääntyneitä: ${due.length}`);
  }

  if (!due.length) return;

  for (const schedule of due) {
    console.log(`[scheduled-reports] Ajetaan: "${schedule.name}" (${schedule._id})`);
    await executeSchedule(schedule, now);
  }
}

module.exports = { runScheduledReports, executeSchedule, resolveDataRange };
