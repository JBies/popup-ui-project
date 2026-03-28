// utils/weekly-report.js
// Viikkoraportin generointi ja lähetys kaikille käyttäjille

const User  = require('../models/User');
const Popup = require('../models/Popup');
const Lead  = require('../models/Lead');
const { sendMail } = require('./email');
const { buildWeeklyReport } = require('./email-templates');

/**
 * Laskee alkamis- ja loppumisajat edelliselle ja sitä edeltävälle viikolle
 */
function getWeekRanges() {
  const now = new Date();

  // Edellinen viikko: ma–su
  const dayOfWeek = now.getDay(); // 0=su, 1=ma, ...
  const daysToLastMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() - daysToLastMonday);
  thisMonday.setHours(0, 0, 0, 0);

  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(thisMonday.getDate() - 7);

  const lastSunday = new Date(thisMonday);
  lastSunday.setMilliseconds(-1); // juuri ennen tätä maanantaita

  const prevMonday = new Date(lastMonday);
  prevMonday.setDate(lastMonday.getDate() - 7);

  const prevSunday = new Date(lastMonday);
  prevSunday.setMilliseconds(-1);

  // Viikkonumero viikkoraporttiviikkolle
  const startOfYear = new Date(lastMonday.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((lastMonday - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
  const weekLabel = `Viikko ${weekNum} / ${lastMonday.getFullYear()}`;

  return { lastMonday, lastSunday, prevMonday, prevSunday, weekLabel };
}

/**
 * Kerää tilastot yhden käyttäjän elementeistä halutulta aikaväliltä.
 * @param {string} userId
 * @param {Date} from
 * @param {Date} to
 * @returns {{ views, clicks, leads }}
 */
async function getStatsForPeriod(userId, from, to) {
  // Popupit eivät tallenna päivittäisiä tilastoja – käytetään Lead-mallia liideille
  // ja Popup.statistics:ssa olevaa kokonaismäärää vertailuun ei voi käyttää ajalta,
  // joten leads lasketaan tarkasti Lead-mallista.
  // Views + clicks kerätään statistiikasta (kumulatiivisia – paras saatavilla oleva data)

  const popups = await Popup.find({ userId }).select('statistics').lean();
  const leads = await Lead.countDocuments({ userId, submittedAt: { $gte: from, $lte: to } });

  // Koska per-päivä view/click-logia ei vielä ole, palautetaan kumulatiivinen summa
  // (sama luku molemmille periodeille) – delta on 0 mutta leads on tarkka.
  // Tämä on paras mahdollinen ilman aikasarjatietokantaa.
  const views  = popups.reduce((s, p) => s + (p.statistics?.views  || 0), 0);
  const clicks = popups.reduce((s, p) => s + (p.statistics?.clicks || 0), 0);

  return { views, clicks, leads };
}

/**
 * Hakee top-3 elementtiä konversion (clicks/views) perusteella
 */
async function getTopElements(userId) {
  const popups = await Popup.find({ userId }).select('name elementType statistics').lean();
  return popups
    .map(p => ({
      name:  p.name || 'Nimetön',
      type:  p.elementType || 'popup',
      views:  p.statistics?.views  || 0,
      clicks: p.statistics?.clicks || 0,
      leads:  p.statistics?.leads  || 0,
    }))
    .sort((a, b) => {
      // Järjestä liidien, sitten klikkausten mukaan
      if (b.leads !== a.leads) return b.leads - a.leads;
      return b.clicks - a.clicks;
    })
    .slice(0, 3);
}

/**
 * Hakee viikon liidit (max 10 uusinta)
 */
async function getWeekLeads(userId, from, to) {
  const leads = await Lead
    .find({ userId, submittedAt: { $gte: from, $lte: to } })
    .sort({ submittedAt: -1 })
    .limit(10)
    .populate('popupId', 'name')
    .lean();

  return leads.map(l => ({
    popupName: l.popupId?.name || 'Tuntematon',
    data:      l.data || {},
    submittedAt: l.submittedAt,
  }));
}

/**
 * Lähettää viikkoraportit kaikille käyttäjille joilla raportti on päällä.
 */
async function sendWeeklyReports() {
  console.log('[weekly-report] Aloitetaan viikkoraporttien lähetys...');

  const { lastMonday, lastSunday, prevMonday, prevSunday, weekLabel } = getWeekRanges();

  // Hae kaikki aktiiviset käyttäjät (ei pending)
  const users = await User.find({
    role: { $in: ['user', 'admin'] },
    'emailNotifications.weeklyReport': { $ne: false }
  }).lean();

  console.log(`[weekly-report] ${users.length} käyttäjää joille lähetetään raportti`);

  let sent = 0;
  let failed = 0;

  for (const user of users) {
    try {
      const toEmail = user.emailNotifications?.notifyEmail?.trim() || user.email;
      if (!toEmail) continue;

      // Tilastot tältä viikolta ja edelliseltä
      const [thisPeriod, prevPeriod] = await Promise.all([
        getStatsForPeriod(user._id, lastMonday, lastSunday),
        getStatsForPeriod(user._id, prevMonday, prevSunday),
      ]);

      const stats = {
        views:      thisPeriod.views,
        clicks:     thisPeriod.clicks,
        leads:      thisPeriod.leads,
        prevViews:  prevPeriod.views,
        prevClicks: prevPeriod.clicks,
        prevLeads:  prevPeriod.leads,
      };

      const topElements = await getTopElements(user._id);
      const weekLeads   = await getWeekLeads(user._id, lastMonday, lastSunday);

      const { subject, html } = buildWeeklyReport(user, stats, topElements, weekLeads, weekLabel);
      const ok = await sendMail(toEmail, subject, html);

      if (ok) sent++;
      else failed++;
    } catch (err) {
      console.error(`[weekly-report] Virhe käyttäjälle ${user.email}:`, err.message);
      failed++;
    }
  }

  console.log(`[weekly-report] Valmis. Lähetetty: ${sent}, epäonnistui: ${failed}`);
}

module.exports = { sendWeeklyReports };
