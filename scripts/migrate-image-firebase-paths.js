/**
 * Migraatioskrip: Täyttää imageFirebasePath-kentän olemassa oleville Popup-dokumenteille.
 *
 * Aja tuotantopalvelimella:
 *   NODE_ENV=production node scripts/migrate-image-firebase-paths.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Popup = require('../models/Popup');
const Image = require('../models/Image');
const { bucket } = require('../firebase');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  // Hae kaikki Image-tietueet joilla on firebasePath
  const images = await Image.find({ firebasePath: { $exists: true, $ne: '' } }).lean();
  console.log(`Found ${images.length} Image records with firebasePath`);

  // Rakenna hakutaulukko: popupId → firebasePath (Image.usedInPopups viittaa popup ID:hen)
  const popupToPath = {};
  for (const img of images) {
    if (img.usedInPopups && img.usedInPopups.length > 0) {
      for (const popupId of img.usedInPopups) {
        popupToPath[popupId.toString()] = img.firebasePath;
      }
    }
  }
  console.log(`Mapped ${Object.keys(popupToPath).length} popup IDs to Firebase paths`);

  // Hae popupit joilla on imageUrl mutta ei imageFirebasePath
  const popups = await Popup.find({
    imageUrl: { $ne: '' },
    $or: [{ imageFirebasePath: { $exists: false } }, { imageFirebasePath: '' }]
  }).lean();
  console.log(`Popups missing imageFirebasePath: ${popups.length}`);

  let updated = 0;
  let skipped = 0;

  for (const popup of popups) {
    const firebasePath = popupToPath[popup._id.toString()];
    if (firebasePath) {
      await Popup.updateOne({ _id: popup._id }, { $set: { imageFirebasePath: firebasePath } });
      console.log(`  ✅ Updated "${popup.name}" → ${firebasePath}`);
      updated++;
    } else {
      // Jos Image.usedInPopups ei sisällä tätä popup-ID:tä, yritä käyttäjän ainoaa kuvaa
      const userImages = images.filter(img => img.userId.toString() === popup.userId.toString());
      if (userImages.length === 1) {
        await Popup.updateOne({ _id: popup._id }, { $set: { imageFirebasePath: userImages[0].firebasePath } });
        console.log(`  ✅ Updated "${popup.name}" via single-user-image → ${userImages[0].firebasePath}`);
        updated++;
      } else {
        console.log(`  ⚠️  Skipped "${popup.name}" (${popup._id}) — could not match (${userImages.length} user images)`);
        skipped++;
      }
    }
  }

  console.log(`\n📊 Migration complete: ${updated} updated, ${skipped} skipped`);

  // Refresh signed URLs for popups that now have imageFirebasePath
  console.log('\n🔄 Refreshing signed URLs in Popup documents...');
  const toRefresh = await Popup.find({ imageUrl: { $ne: '' }, imageFirebasePath: { $ne: '' } }).lean();
  let refreshed = 0;
  for (const popup of toRefresh) {
    try {
      const [signedUrl] = await bucket.file(popup.imageFirebasePath).getSignedUrl({
        action: 'read',
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        version: 'v4'
      });
      await Popup.updateOne({ _id: popup._id }, { $set: { imageUrl: signedUrl } });
      refreshed++;
    } catch (e) {
      console.error(`  ❌ Failed to refresh URL for "${popup.name}":`, e.message);
    }
  }
  console.log(`✅ Refreshed ${refreshed} popup image URLs`);

  await mongoose.disconnect();
  console.log('\nDone!');
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
