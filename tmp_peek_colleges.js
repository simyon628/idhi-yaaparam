const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

async function peekColleges() {
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
    const collegesSnap = await db.collection('colleges').limit(5).get();
    
    console.log("Peeking at 5 colleges:");
    collegesSnap.forEach(doc => {
        console.log(`ID: ${doc.id} | Data: ${JSON.stringify(doc.data())}`);
    });

    process.exit(0);
}

peekColleges();
