// firebase.js
const admin = require('firebase-admin');
const serviceAccount = require('./firebaseSDK.json'); // Korvaa tämä oikealla polulla

// Alustetaan Firebase app
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'popup-manager-e4753.firebasestorage.app' // Korvaa tämä Firebase-projektisi ID:llä
});

// Luodaan bucket-viittaus tallennus-operaatioita varten
const bucket = admin.storage().bucket();

module.exports = {
  admin,
  bucket
};