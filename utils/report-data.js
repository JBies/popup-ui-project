// utils/report-data.js
// Jaettu datahakufunktio raporteille — käytetään sekä manuaalisissa että aikataulutetuissa raporteissa

const Popup      = require('../models/Popup');
const Lead       = require('../models/Lead');
const DailyStats = require('../models/DailyStats');

/**
 * Hakee raporttidata annetulle popup-suodattimelle ja aikavälille.
 *
 * @param {object} popupFilter  - Mongoose-suodatin Popup-kokoelmalle (userId vaaditaan)
 * @param {Date}   fromDate
 * @param {Date}   toDate
 * @param {string} fromStr      - 'YYYY-MM-DD'
 * @param {string} toStr        - 'YYYY-MM-DD'
 * @param {object} [opts]
 * @param {number} [opts.leadLimit=20]        - Max liidit recentLeads-listassa
 * @param {'leads'|'views'} [opts.sortTopBy='leads'] - Miten top-elementit lajitellaan
 * @returns {{ period, allTime, topElements, recentLeads }}
 */
async function fetchReportData(popupFilter, fromDate, toDate, fromStr, toStr, opts = {}) {
  const { leadLimit = 20, sortTopBy = 'leads' } = opts;
  const userId = popupFilter.userId;

  const popups = await Popup.find(popupFilter)
    .select('_id name elementType statistics siteId scrollStats')
    .lean();

  const popupIds = popups.map(p => p._id);

  if (!popupIds.length) {
    return {
      period:      { views: 0, clicks: 0, leads: 0, scrollSessions: 0, scrollAvgDepth: 0 },
      allTime:     { views: 0, clicks: 0, leads: 0 },
      topElements: [],
      recentLeads: [],
    };
  }

  const leadFilter = {
    userId,
    popupId: { $in: popupIds },
    submittedAt: { $gte: fromDate, $lte: toDate },
  };

  const [dailyAgg, periodLeads, recentLeadsRaw] = await Promise.all([
    DailyStats.aggregate([
      { $match: { popupId: { $in: popupIds }, date: { $gte: fromStr, $lte: toStr } } },
      { $group: { _id: null, views: { $sum: '$views' }, clicks: { $sum: '$clicks' } } },
    ]),
    Lead.countDocuments(leadFilter),
    Lead.find(leadFilter)
      .sort({ submittedAt: -1 })
      .limit(leadLimit)
      .populate('popupId', 'name elementType siteId')
      .lean(),
  ]);

  // Vieritystilastot Popup.scrollStats-kentästä
  let totalScrollDepth = 0;
  let scrollCount = 0;
  let totalScrollSessions = 0;
  for (const p of popups) {
    if (p.scrollStats?.sessions) {
      totalScrollSessions += p.scrollStats.sessions;
      totalScrollDepth    += p.scrollStats.avgDepth * p.scrollStats.sessions;
      scrollCount         += p.scrollStats.sessions;
    }
  }
  const scrollAvgDepth = scrollCount > 0 ? Math.round(totalScrollDepth / scrollCount) : 0;

  const period = {
    views:          dailyAgg[0]?.views  || 0,
    clicks:         dailyAgg[0]?.clicks || 0,
    leads:          periodLeads,
    scrollSessions: totalScrollSessions,
    scrollAvgDepth,
  };

  const allTime = popups.reduce((acc, p) => {
    acc.views  += p.statistics?.views  || 0;
    acc.clicks += p.statistics?.clicks || 0;
    acc.leads  += p.statistics?.leads  || 0;
    return acc;
  }, { views: 0, clicks: 0, leads: 0 });

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
    .sort(sortTopBy === 'views'
      ? (a, b) => b.views - a.views || b.clicks - a.clicks || b.leads - a.leads
      : (a, b) => b.leads - a.leads || b.clicks - a.clicks || b.views - a.views
    );

  const recentLeads = recentLeadsRaw.map(l => ({
    popupName:   l.popupId?.name        || '(poistettu elementti)',
    elementType: l.popupId?.elementType || null,
    siteId:      l.popupId?.siteId      || null,
    data:        l.data                 || {},
    submittedAt: l.submittedAt,
  }));

  return { period, allTime, topElements, recentLeads };
}

module.exports = { fetchReportData };
