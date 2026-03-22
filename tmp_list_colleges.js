const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

async function listAllColleges() {
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
    
    console.log(`Total colleges: ${collegesSnap.size}`);
    const colleges = [];
    collegesSnap.forEach(doc => {
        const data = doc.data();
        colleges.push({ id: doc.id, name: data.name, acronym: data.acronym, shortName: data.shortName });
    });
    
    // Sort by name for easier scanning
    colleges.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    
    colleges.forEach(c => {
        console.log(`ID: ${c.id} | Name: ${c.name} | Acronym: ${c.acronym} | ShortName: ${c.shortName}`);
    });

    process.exit(0);
}

listAllColleges();
