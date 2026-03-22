require('dotenv').config({ path: '.env.local' });
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
const unescapedJson = serviceAccountJson.replace(/\\n/g, '\n');
const serviceAccount = JSON.parse(unescapedJson);

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function checkRentals() {
  const snap = await db.collection('rentals').get();
  console.log('Total rentals found:', snap.size);
  snap.forEach(doc => {
    console.log(doc.id, '=>', JSON.stringify(doc.data(), null, 2));
  });
  process.exit(0);
}

checkRentals().catch(console.error);
