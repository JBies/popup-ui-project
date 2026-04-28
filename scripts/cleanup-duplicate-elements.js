// scripts/cleanup-duplicate-elements.js
// Siivoa duplikaatti PageElement -dokumentit
// Ryhmitellaan popupId + href(normalisoitu) + text + type mukaan.
// Aja: node scripts/cleanup-duplicate-elements.js

const mongoose = require('mongoose');
require('dotenv').config();

const PageElement = require('../models/PageElement');

// Sama normalisointi kuin ui-embed.js:ssa: poista ?query ja #anchor
function normalizeHref(href) {
  if (!href) return '';
  return href.split('?')[0].split('#')[0];
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Yhdistetty MongoDB:hen');

  const total = await PageElement.countDocuments();
  console.log('Elementteja yhteensa ennen siivousta:', total);

  // Hae kaikki dokumentit
  const all = await PageElement.find({}).lean();

  // Ryhmittele popupId + normalisoituHref + text + type mukaan
  const groups = {};
  for (const el of all) {
    const key = String(el.popupId) + '|' + normalizeHref(el.href) + '|' + (el.text || '') + '|' + (el.type || '');
    if (!groups[key]) groups[key] = [];
    groups[key].push(el);
  }

  let removed = 0;
  for (const [key, els] of Object.entries(groups)) {
    if (els.length <= 1) continue;

    // Sailyta se jolla on eniten klikkeja, tai ensimmainen
    els.sort((a, b) => (b.clicks || 0) - (a.clicks || 0));
    const keep = els[0];
    const remove = els.slice(1);

    const totalClicks = els.reduce((s, e) => s + (e.clicks || 0), 0);
    await PageElement.updateOne({ _id: keep._id }, { $set: { clicks: totalClicks } });
    await PageElement.deleteMany({ _id: { $in: remove.map(e => e._id) } });
    removed += remove.length;
  }

  const after = await PageElement.countDocuments();
  console.log('Poistettu duplikaatteja:', removed);
  console.log('Elementteja jaljella:', after);

  await mongoose.disconnect();
  console.log('Valmis.');
}

run().catch(e => { console.error(e); process.exit(1); });
