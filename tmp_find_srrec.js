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
    const collegesRef = db.collection('colleges');
    const snapshot = await collegesRef.get();
    
    console.log(`Total colleges: ${snapshot.size}`);
    snapshot.forEach(doc => {
        const data = doc.data();
        const id = doc.id;
        const name = data.name || '';
        const shortName = data.shortName || '';
        if (id.includes('SRR') || name.includes('SRR') || shortName.includes('SRR')) {
            console.log(`Match Found! ID: ${id}, Name: ${name}, ShortName: ${shortName}`);
        }
    });

    process.exit(0);
}

findSRREC();
