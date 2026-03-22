const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

async function findSRREC() {
    let serviceAccount;
    try {
        const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
        const unescapedJson = json.replace(/\\n/g, '\n');
        serviceAccount = JSON.parse(unescapedJson);
    } catch (e) {
        process.exit(1);
    }

    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    }

    const db = admin.firestore();
    const collegesSnap = await db.collection('colleges').get();
    
    console.log(`Searching through ${collegesSnap.size} colleges...`);
    let matches = [];
    collegesSnap.forEach(doc => {
        const data = doc.data();
        const fullText = `${doc.id} ${data.name} ${data.shortName} ${data.acronym}`.toUpperCase();
        if (fullText.includes('SRR') || fullText.includes('ENGINEERING') && fullText.includes('CHENNAI')) {
             matches.push({ id: doc.id, name: data.name, shortName: data.shortName });
        }
    });
    
    if (matches.length > 0) {
        console.log("Potential matches found:");
        matches.forEach(m => console.log(`ID: ${m.id} | Name: ${m.name} | ShortName: ${m.shortName}`));
    } else {
        console.log("No matches found for 'SRR' or similar.");
    }

    process.exit(0);
}

findSRREC();
