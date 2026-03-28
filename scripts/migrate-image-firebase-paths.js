/**
 * Migraatioskrip: Täyttää imageFirebasePath-kentän olemassa oleville Popup-dokumenteille.
 * Käyttää allekirjoitetun URL:in polkuosaa Firebase-polun selvittämiseen.
 *
 * Aja tuotantopalvelimella:
 *   node scripts/migrate-image-firebase-paths.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Popup = require('../models/Popup');
const { bucket } = require('../firebase');

/**
 * Poimii Firebase-polun allekirjoitetusta tai tavallisesta storage-URL:ista.
 * Esimerkki:
 *   https://storage.googleapis.com/bucket/popupImages/abc.jpg?X-Goog-...
 *   → popupImages/abc.jpg
 */
function extractFirebasePath(imageUrl, bucketName) {
  if (!imageUrl) return null;
  try {
    const parsed = new URL(imageUrl);
    // pathname on muotoa /bucket-name/popupImages/file.jpg
    // tai /v0/b/bucket/o/popupImages%2Ffile.jpg (Firebase download URL)
    let pathname = parsed.pathname;

    // Firebase download URL muoto
    if (pathname.startsWith('/v0/b/')) {
      const match = pathname.match(/\/v0\/b\/[^/]+\/o\/(.+)/);
      if (match) return decodeURIComponent(match[1]);
    }

    // storage.googleapis.com muoto: /bucket-name/path/to/file
    if (bucketName && pathname.startsWith('/' + bucketName + '/')) {
      return pathname.slice(bucketName.length + 2); // +2 for /bucket/
    }

    // Kokeile ilman bucket-nimeä: oleta että ensimmäinen osa on bucket
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length >= 2) {
      return parts.slice(1).join('/'); // Poista ensimmäinen osa (bucket)
    }
  } catch (e) {
    // ignore
  }
  return null;
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const bucketName = bucket.name;
  console.log('Firebase bucket:', bucketName);

  // Hae kaikki Firebase-tiedostot
  const [fbFiles] = await bucket.getFiles({ prefix: 'popupImages/' });
  console.log(`Firebase files in bucket: ${fbFiles.length}`);
  const fbPaths = new Set(fbFiles.map(f => f.name));
  fbFiles.forEach(f => console.log('  -', f.name));

  // Hae popupit joilla on imageUrl
  const popups = await Popup.find({ imageUrl: { $ne: '' } }).lean();
  console.log(`\nPopups with imageUrl: ${popups.length}`);

  let updated = 0;
  let skipped = 0;

  for (const popup of popups) {
    const path = extractFirebasePath(popup.imageUrl, bucketName);
    console.log(`\n"${popup.name}" → extracted path: ${path}`);

    if (!path) {
      console.log('  ⚠️  Could not extract path from URL');
      skipped++;
      continue;
    }

    if (!fbPaths.has(path)) {
      console.log(`  ⚠️  Path not found in Firebase bucket: ${path}`);
      // Tallenna polku silti – tiedosto saattaa olla olemassa vaikka lista ei täsmää
    }

    // Generoi uusi 7 päivän URL
    try {
      const [signedUrl] = await bucket.file(path).getSignedUrl({
        action: 'read',
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        version: 'v4'
      });

      await Popup.updateOne(
        { _id: popup._id },
        { $set: { imageFirebasePath: path, imageUrl: signedUrl } }
      );
      console.log(`  ✅ Updated imageFirebasePath and refreshed URL`);
      updated++;
    } catch (e) {
      console.error(`  ❌ Error generating signed URL: ${e.message}`);
      // Tallenna vähintään polku
      await Popup.updateOne({ _id: popup._id }, { $set: { imageFirebasePath: path } });
      console.log(`  ✅ Saved imageFirebasePath (URL refresh failed)`);
      updated++;
    }
  }

  console.log(`\n📊 Migration complete: ${updated} updated, ${skipped} skipped`);
  await mongoose.disconnect();
  console.log('Done!');
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
