const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

async function verifySRREC() {
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
    const colleges = await db.collection('colleges').get();
    
    let found = false;
    colleges.forEach(doc => {
        const data = doc.data();
        if (data.name && data.name.includes("Sagi Ramakrishnam Raju")) {
            console.log(`FOUND! ID: ${doc.id} | Full Name: ${data.name}`);
            found = true;
        }
    });
    
    if (!found) {
        console.log("No college found with 'Sagi Ramakrishnam Raju' in its name.");
    }
    process.exit(0);
}

verifySRREC();
