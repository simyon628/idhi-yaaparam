const admin = require('firebase-admin');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function listCollegesToFile() {
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
    
    let output = "";
    collegesSnap.forEach(doc => {
        const data = doc.data();
        output += `ID: ${doc.id} | Name: ${data.name}\n`;
    });
    
    fs.writeFileSync('colleges_list.txt', output);
    console.log(`Saved ${collegesSnap.size} colleges to colleges_list.txt`);
    process.exit(0);
}

listCollegesToFile();
