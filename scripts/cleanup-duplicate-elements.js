// scripts/cleanup-duplicate-elements.js
// Siivoa duplikaatti PageElement -dokumentit
// Vanhat elementit tallennettiin URL+href+text+tag -fingerprintilla.
// Uusi fingerprint on pelkka href+text+tag.
// Ryhmitellaan popupId + href + text + type mukaan ja poistetaan duplikaatit.
// Aja: node scripts/cleanup-duplicate-elements.js

const mongoose = require('mongoose');
require('dotenv').config();

const PageElement = require('../models/PageElement');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Yhdistetty MongoDB:hen');

  const total = await PageElement.countDocuments();
  console.log('Elementteja yhteensa ennen siivousta:', total);

  // Ryhmittele popupId + href + text + type mukaan (uusi fingerprint-logiikka)
  // Nain loydetaan elementit jotka ovat sama nappi/linkki eri URL-fingerprintilla
  const dups = await PageElement.aggregate([
    { $group: {
      _id: {
        popupId: '$popupId',
        href:    '$href',
        text:    '$text',
        type:    '$type'
      },
      ids:         { $push: '$_id' },
      totalClicks: { $sum: '$clicks' },
      count:       { $sum: 1 }
    }},
    { $match: { count: { $gt: 1 } } }
  ]);

  console.log('Duplikaattiryhmia loydetty:', dups.length);

  let removed = 0;
  for (const d of dups) {
    // Sailyta ensimmainen, poista loput
    const [keepId, ...removeIds] = d.ids;
    // Paivita sailytettava dokumentti yhteisklikkimaaralla
    await PageElement.updateOne({ _id: keepId }, { $set: { clicks: d.totalClicks } });
    // Poista duplikaatit
    await PageElement.deleteMany({ _id: { $in: removeIds } });
    removed += removeIds.length;
  }

  const after = await PageElement.countDocuments();
  console.log('Poistettu duplikaatteja:', removed);
  console.log('Elementteja jaljella:', after);

  await mongoose.disconnect();
  console.log('Valmis.');
}

run().catch(e => { console.error(e); process.exit(1); });
