const Popup = require('../models/Popup');
const PageElement = require('../models/PageElement');
const ScrollStats = require('../models/ScrollStats');

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// Hae popup-datan targeting-säännöistä URL-säännöt
function getTargetedPages(popup) {
  const t = popup.targeting;
  if (!t?.enabled) return []; // Ei sääntöjä = kaikki sivut

  const urlRules = t.rules?.filter(r => r.type === 'url') || [];
  return urlRules;  // Palauta säännön objektit: { type, operator, value }
}

class PageTrackingController {

  // POST /api/popups/page-elements/:id/discover  (julkinen, embed)
  static async discoverElements(req, res) {
    try {
      const popup = await Popup.findById(req.params.id).select('_id userId').lean();
      if (!popup) return res.status(404).json({ error: 'Not found' });

      const elements = Array.isArray(req.body.elements) ? req.body.elements : [];
      let count = 0;

      for (const el of elements) {
        if (!el.fingerprint) continue;
        try {
          await PageElement.findOneAndUpdate(
            { popupId: popup._id, fingerprint: el.fingerprint },
            {
              $setOnInsert: {
                popupId:     popup._id,
                userId:      popup.userId,
                type:        el.type || 'link',
                href:        el.href || '',
                fingerprint: el.fingerprint,
                clicks:      0,
                active:      true,
                createdAt:   new Date()
              },
              // Päivitä aina – teksti/selektori/url voi muuttua jos sivun rakenne muuttuu
              $set: {
                text:        (el.text || '').slice(0, 200),
                cssSelector: el.cssSelector || '',
                pageUrl:     el.pageUrl || ''
              }
            },
            { upsert: true }
          );
          count++;
        } catch (e) {
          // Unique constraint violation = already exists, skip
          if (e.code !== 11000) throw e;
        }
      }

      res.json({ ok: true, count });
    } catch (err) {
      console.error('discoverElements error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }

  // POST /api/popups/page-elements/:id/click  (julkinen, embed)
  // body: { fingerprint }
  static async recordPageElementClick(req, res) {
    try {
      const { fingerprint } = req.body;
      if (!fingerprint) return res.status(400).json({ error: 'fingerprint required' });

      await PageElement.findOneAndUpdate(
        { popupId: req.params.id, fingerprint, active: true },
        { $inc: { clicks: 1 }, $set: { lastClicked: new Date() } }
      );

      res.json({ ok: true });
    } catch (err) {
      console.error('recordPageElementClick error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }

  // GET /api/popups/page-elements/:id  (auth, dashboard)
  static async listPageElements(req, res) {
    try {
      const popup = await Popup.findOne({ _id: req.params.id, userId: req.user._id }).select('_id').lean();
      if (!popup) return res.status(404).json({ error: 'Not found' });

      // Sivukohtainen suodatus
      const { pageUrl } = req.query;
      const query = { popupId: popup._id, active: true };
      if (pageUrl && pageUrl.trim() !== '') {
        query.pageUrl = pageUrl;
      }

      const elements = await PageElement.find(query)
        .sort({ clicks: -1 })
        .lean();

      res.json(elements);
    } catch (err) {
      console.error('listPageElements error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }

  // POST /api/popups/page-elements/:id/manual  (auth, dashboard)
  // body: { cssSelector, label }
  static async addManualElement(req, res) {
    try {
      const popup = await Popup.findOne({ _id: req.params.id, userId: req.user._id }).select('_id userId').lean();
      if (!popup) return res.status(404).json({ error: 'Not found' });

      const { cssSelector, label } = req.body;
      if (!cssSelector) return res.status(400).json({ error: 'cssSelector required' });

      const fingerprint = djb2('manual|' + cssSelector);

      const doc = await PageElement.findOneAndUpdate(
        { popupId: popup._id, fingerprint },
        {
          $setOnInsert: {
            popupId:     popup._id,
            userId:      popup.userId,
            type:        'manual',
            text:        (label || cssSelector).slice(0, 200),
            href:        '',
            cssSelector: cssSelector,
            fingerprint: fingerprint,
            pageUrl:     '',
            clicks:      0,
            active:      true,
            createdAt:   new Date()
          }
        },
        { upsert: true, new: true }
      );

      res.json(doc);
    } catch (err) {
      if (err.code === 11000) {
        const existing = await PageElement.findOne({ popupId: req.params.id, fingerprint: djb2('manual|' + req.body.cssSelector) });
        return res.json(existing);
      }
      console.error('addManualElement error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }

  // DELETE /api/popups/page-elements/:pageElementId  (auth, soft-delete)
  static async deactivatePageElement(req, res) {
    try {
      await PageElement.findOneAndUpdate(
        { _id: req.params.pageElementId, userId: req.user._id },
        { active: false }
      );
      res.json({ ok: true });
    } catch (err) {
      console.error('deactivatePageElement error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }

  // POST /api/popups/scroll/:id  (julkinen, embed)
  // body: { maxDepth, pauses: [Number], pageUrl }
  static async recordScroll(req, res) {
    try {
      const popup = await Popup.findById(req.params.id).select('_id userId scrollStats').lean();
      if (!popup) return res.status(404).json({ error: 'Not found' });

      const maxDepth = Math.min(100, Math.max(0, parseInt(req.body.maxDepth) || 0));
      const pauses = Array.isArray(req.body.pauses) ? req.body.pauses.map(d => parseInt(d)).filter(d => !isNaN(d)) : [];
      const pageUrl = req.body.pageUrl || '';

      const bucketField = maxDepth >= 100 ? 'd100'
        : maxDepth >= 90 ? 'd90'
        : maxDepth >= 75 ? 'd75'
        : maxDepth >= 50 ? 'd50'
        : maxDepth >= 25 ? 'd25'
        : 'd10';

      const inc = { [`buckets.${bucketField}`]: 1 };

      const today = todayStr();
      let scrollDoc = await ScrollStats.findOne({ popupId: popup._id, date: today });

      if (!scrollDoc) {
        scrollDoc = await ScrollStats.create({
          popupId: popup._id,
          userId:  popup.userId,
          date:    today,
          pageUrl: pageUrl,
          buckets: { d10: 0, d25: 0, d50: 0, d75: 0, d90: 0, d100: 0 },
          pauses:  []
        });
      }

      // Increment bucket
      await ScrollStats.updateOne({ _id: scrollDoc._id }, { $inc: inc });

      // Update pauses (aggregate nearby depths within ±5%)
      if (pauses.length > 0) {
        const fresh = await ScrollStats.findById(scrollDoc._id);
        for (const depth of pauses) {
          const nearby = fresh.pauses.find(p => Math.abs(p.depth - depth) <= 5);
          if (nearby) {
            nearby.count += 1;
          } else {
            fresh.pauses.push({ depth, count: 1 });
          }
        }
        fresh.pauses.sort((a, b) => a.depth - b.depth);
        await fresh.save();
      }

      // Update Popup.scrollStats summary
      const prevSessions = popup.scrollStats ? popup.scrollStats.sessions || 0 : 0;
      const prevAvg = popup.scrollStats ? popup.scrollStats.avgDepth || 0 : 0;
      const newSessions = prevSessions + 1;
      const newAvg = Math.round((prevAvg * prevSessions + maxDepth) / newSessions);

      await Popup.updateOne(
        { _id: popup._id },
        { $set: { 'scrollStats.sessions': newSessions, 'scrollStats.avgDepth': newAvg, 'scrollStats.lastUpdated': new Date() } }
      );

      res.json({ ok: true });
    } catch (err) {
      console.error('recordScroll error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }

  // GET /api/popups/scroll/:id  (auth, dashboard)
  static async getScrollStats(req, res) {
    try {
      const popup = await Popup.findOne({ _id: req.params.id, userId: req.user._id })
        .select('scrollStats').lean();
      if (!popup) return res.status(404).json({ error: 'Not found' });

      // Sivukohtainen suodatus
      const { pageUrl } = req.query;
      const query = { popupId: req.params.id };
      if (pageUrl && pageUrl.trim() !== '') {
        query.pageUrl = pageUrl;
      }

      // Aggregate buckets across all dates
      const rows = await ScrollStats.find(query).lean();

      const totals = { d10: 0, d25: 0, d50: 0, d75: 0, d90: 0, d100: 0 };
      const pauseMap = {};
      for (const row of rows) {
        for (const key of Object.keys(totals)) {
          totals[key] += row.buckets[key] || 0;
        }
        for (const p of row.pauses || []) {
          const bucket = Math.round(p.depth / 5) * 5;
          pauseMap[bucket] = (pauseMap[bucket] || 0) + p.count;
        }
      }

      const pauses = Object.entries(pauseMap)
        .map(([depth, count]) => ({ depth: Number(depth), count }))
        .sort((a, b) => a.depth - b.depth);

      res.json({
        summary: popup.scrollStats || { sessions: 0, avgDepth: 0 },
        buckets: totals,
        pauses
      });
    } catch (err) {
      console.error('getScrollStats error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
}

function djb2(str) {
  var hash = 5381;
  for (var i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return (hash >>> 0).toString(16);
}

module.exports = PageTrackingController;
