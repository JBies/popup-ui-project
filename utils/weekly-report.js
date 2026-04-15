// utils/weekly-report.js
// Viikkoraportin generointi ja lähetys kaikille käyttäjille

const User       = require('../models/User');
const Popup      = require('../models/Popup');
const Lead       = require('../models/Lead');
const DailyStats = require('../models/DailyStats');
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
  const fmt = (d) => d.toLocaleDateString('fi-FI', { day: 'numeric', month: 'numeric' });
  const weekLabel = `${fmt(lastMonday)}–${fmt(lastSunday)} ${lastMonday.getFullYear()}`;

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
  // Muodosta päivämäärästring-raja DailyStats-kyselyä varten
  const fromStr = from.toISOString().slice(0, 10);
  const toStr   = to.toISOString().slice(0, 10);

  const [dailyAgg, leads] = await Promise.all([
    // Jaksokohtaiset views + clicks DailyStats-kokoelmasta
    DailyStats.aggregate([
      { $match: { userId, date: { $gte: fromStr, $lte: toStr } } },
      { $group: { _id: null, views: { $sum: '$views' }, clicks: { $sum: '$clicks' } } },
    ]),
    // Liidit Lead-mallista (tarkka timestamp-suodatus)
    Lead.countDocuments({ userId, submittedAt: { $gte: from, $lte: to } }),
  ]);

  return {
    views:  dailyAgg[0]?.views  || 0,
    clicks: dailyAgg[0]?.clicks || 0,
    leads,
  };
}

/**
 * Hakee kaikki-aikaisen kokonaissumman käyttäjän kaikista elementeistä.
 */
async function getAllTimeStats(userId) {
  const popups = await Popup.find({ userId }).select('statistics').lean();
  return popups.reduce((acc, p) => {
    acc.views  += p.statistics?.views  || 0;
    acc.clicks += p.statistics?.clicks || 0;
    acc.leads  += p.statistics?.leads  || 0;
    return acc;
  }, { views: 0, clicks: 0, leads: 0 });
}

/**
 * Hakee top-3 elementtiä konversion (clicks/views) perusteella
 */
async function getTopElements(userId) {
  const popups = await Popup.find({ userId, elementType: { $ne: 'stats_only' } })
    .select('name elementType statistics').lean();
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

      // Tilastot tältä viikolta, edelliseltä ja kaikki-aikainen
      const [thisPeriod, prevPeriod, allTime] = await Promise.all([
        getStatsForPeriod(user._id, lastMonday, lastSunday),
        getStatsForPeriod(user._id, prevMonday, prevSunday),
        getAllTimeStats(user._id),
      ]);

      const stats = {
        // Jaksokohtaiset (viikko)
        views:     thisPeriod.views,
        clicks:    thisPeriod.clicks,
        leads:     thisPeriod.leads,
        prevLeads: prevPeriod.leads,
        // Kaikki aika
        allViews:  allTime.views,
        allClicks: allTime.clicks,
        allLeads:  allTime.leads,
      };

      // Skipata jos viikolla ei tullut yhtään liidiä
      if (thisPeriod.leads === 0) {
        console.log(`[weekly-report] Ei liidejä viikolla – skipataan: ${user.email}`);
        continue;
      }

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
