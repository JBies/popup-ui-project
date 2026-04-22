// controllers/popup/popup.stats.controller.js
// Popup-tilastot ja näyttöjen/käyttäjien seuranta

const Popup = require('../../models/Popup');
const DailyStats = require('../../models/DailyStats');
const { triggerWebhooks } = require('../../utils/webhooks');
const { isViewDuplicate } = require('./popup.utils');

/**
 * Rekisteröi popupin näyttökerran tilastoihin
 */
async function registerView(req, res) {
  try {
    const popupId = req.params.id;
    const ip = req.ip || req.headers['x-forwarded-for']?.split(',')[0].trim() || 'unknown';

    // Hae elementin viewCooldown-asetus
    const popup = await Popup.findById(popupId).select('userId timing').lean();
    if (!popup) return res.status(404).json({ message: 'Not found' });

    const cooldownMs = (popup.timing?.viewCooldown || 0) * 1000;
    if (cooldownMs > 0 && isViewDuplicate(ip, popupId, cooldownMs)) {
      return res.status(200).json({ success: true, duplicate: true });
    }

    const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'

    // Päivitä kumulatiiviset tilastot
    await Popup.findByIdAndUpdate(popupId, {
      $inc: { 'statistics.views': 1 },
      $set: { 'statistics.lastViewed': new Date() }
    });

    // Päivitä päiväkohtaiset tilastot
    if (popup) {
      DailyStats.findOneAndUpdate(
        { userId: popup.userId, popupId, date: today },
        { $inc: { views: 1 } },
        { upsert: true, new: true }
      ).catch(() => {}); // ei blokkaa vastausta
      triggerWebhooks(popup.userId, 'view', { popupId });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error registering view:', err);
    res.status(500).json({ message: 'Error registering view', error: err.toString() });
  }
}

/**
 * Rekisteröi popupin klikkauksen tilastoihin
 */
async function registerClick(req, res) {
  try {
    const popupId = req.params.id;
    const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'

    // Päivitä kumulatiiviset tilastot
    await Popup.findByIdAndUpdate(popupId, {
      $inc: { 'statistics.clicks': 1 },
      $set: { 'statistics.lastClicked': new Date() }
    }, { new: true });

    // Päivitä päiväkohtaiset tilastot
    const clickedPopup = await Popup.findById(popupId).select('userId').lean();
    if (clickedPopup) {
      DailyStats.findOneAndUpdate(
        { userId: clickedPopup.userId, popupId, date: today },
        { $inc: { clicks: 1 } },
        { upsert: true, new: true }
      ).catch(() => {}); // ei blokkaa vastausta
      triggerWebhooks(clickedPopup.userId, 'click', { popupId });
    }

    res.status(200).json({ success: true, message: 'Click registered' });
  } catch (err) {
    console.error('Error registering click:', err);
    res.status(500).json({ message: 'Error registering click', error: err.toString() });
  }
}

/**
 * Hakee popupin tilastot
 */
async function getPopupStats(req, res) {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const popup = await Popup.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!popup) {
      return res.status(404).json({ message: 'Popup not found' });
    }
    
    // Laske klikkiprosentti (CTR)
    let clickThroughRate = 0;
    if (popup.statistics.views > 0) {
      clickThroughRate = (popup.statistics.clicks / popup.statistics.views) * 100;
    }
    
    res.json({
      views: popup.statistics.views || 0,
      clicks: popup.statistics.clicks || 0,
      leads: popup.statistics.leads || 0,
      clickThroughRate: clickThroughRate.toFixed(2),
      lastViewed: popup.statistics.lastViewed || null,
      lastClicked: popup.statistics.lastClicked || null,
      statsResetAt: popup.statistics.statsResetAt || null
    });
  } catch (err) {
    console.error('Error fetching popup statistics:', err);
    res.status(500).json({ message: 'Error fetching popup statistics', error: err.toString() });
  }
}

/**
 * (Admin) Hae popupin tilastot millä tahansa ID:llä
 */
async function getAdminPopupStats(req, res) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const popup = await Popup.findById(req.params.id);
    
    if (!popup) {
      return res.status(404).json({ message: 'Popup not found' });
    }
    
    // Laske klikkiprosentti (CTR)
    let clickThroughRate = 0;
    if (popup.statistics.views > 0) {
      clickThroughRate = (popup.statistics.clicks / popup.statistics.views) * 100;
    }
    
    res.json({
      views: popup.statistics.views || 0,
      clicks: popup.statistics.clicks || 0,
      clickThroughRate: clickThroughRate.toFixed(2),
      lastViewed: popup.statistics.lastViewed || null,
      lastClicked: popup.statistics.lastClicked || null,
      statsResetAt: popup.statistics.statsResetAt || null
    });
  } catch (err) {
    console.error('Error fetching popup statistics:', err);
    res.status(500).json({ message: 'Error fetching popup statistics', error: err.toString() });
  }
}

/**
 * Nollaa popupin tilastot
 */
async function resetStats(req, res) {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const popup = await Popup.findOneAndUpdate(
      { 
        _id: req.params.id,
        userId: req.user._id 
      },
      {
        $set: {
          'statistics.views': 0,
          'statistics.clicks': 0,
          'statistics.lastViewed': null,
          'statistics.lastClicked': null,
          'statistics.statsResetAt': new Date()
        }
      },
      { new: true }
    );

    if (!popup) {
      return res.status(404).json({ message: 'Popup not found' });
    }

    res.json({ success: true, message: 'Statistics reset successfully' });
  } catch (err) {
    console.error('Error resetting popup statistics:', err);
    res.status(500).json({ message: 'Error resetting statistics', error: err.toString() });
  }
}

/**
 * Palauttaa kaikki aktiiviset elementit site-tokenin perusteella (julkinen)
 */
async function getSiteElements(req, res) {
  try {
    const token = req.params.token;
    // Tarkistetaan ensin globaali siteToken
    const User = require('../../models/User');
    let user = await User.findOne({ siteToken: token }).lean();
    let siteFilter = null;

    if (!user) {
      // Etsitään per-sivusto-token User.sites-taulukosta
      user = await User.findOne({ 'sites.token': token }).lean();
      if (!user) return res.status(404).json({ message: 'Site not found' });
      const site = user.sites.find(s => s.token === token);
      siteFilter = site._id;
    }

    const query = { userId: user._id, active: true };
    if (siteFilter) query.siteId = siteFilter;

    const now = new Date();
    const elements = await Popup.find(query).lean();
    // Suodatetaan päättyneet/ei-alkaneet pois
    const visible = elements.filter(el => {
      const start = el.timing?.startDate ? new Date(el.timing.startDate) : null;
      const end   = el.timing?.endDate   ? new Date(el.timing.endDate)   : null;
      if (start && now < start) return false;
      if (end   && now > end)   return false;
      return true;
    });
    // Päivitä kuvan URL:it jos firebasePath on tallennettu
    const { refreshImageUrl } = require('./popup.utils');
    await Promise.all(visible.map(async el => {
      if (el.imageUrl && el.imageFirebasePath) {
        el.imageUrl = await refreshImageUrl(el.imageUrl, el.imageFirebasePath);
      }
    }));
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json(visible);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching site elements', error: err.toString() });
  }
}

module.exports = {
  registerView,
  registerClick,
  getPopupStats,
  getAdminPopupStats,
  resetStats,
  getSiteElements
};