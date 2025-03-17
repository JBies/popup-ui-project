// firebase.js
const admin = require('firebase-admin');
require('dotenv').config(); // Varmista, että dotenv on ladattu

// Luodaan credential-objekti ympäristömuuttujista
const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Korvataan tekstimuotoiset rivinvaihdot todellisilla
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN
};

// Alustetaan Firebase app
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});

// Luodaan bucket-viittaus tallennus-operaatioita varten
const bucket = admin.storage().bucket();

module.exports = {
  admin,
  bucket
};

// Testataan, että Firebase-konfiguraatio toimii
async function testFirebaseConfig() {
  try {
    console.log('Testing Firebase configuration...');
    
    // Kokeillaan bucket-listausta (tämä heittää virheen, jos konfiguraatio on väärä)
    const [files] = await bucket.getFiles({ maxResults: 1 });
    
    console.log('Firebase configuration is working correctly!');
    console.log(`Found ${files.length} files in bucket.`);
    
    return true;
  } catch (error) {
    console.error('Firebase configuration error:', error);
    return false;
  }
}

// Suorita testi jos olemme kehitysympäristössä
if (process.env.NODE_ENV === 'development') {
  testFirebaseConfig().then(success => {
    if (success) {
      console.log('✅ Firebase is properly configured.');
    } else {
      console.error('❌ Firebase configuration needs to be fixed.');
    }
  });
}