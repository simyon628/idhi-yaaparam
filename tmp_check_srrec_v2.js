const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function checkSRREC() {
    console.log("Checking colleges collection...");
    const snapshot = await db.collection('colleges').get();
    
    let found = false;
    snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`Document ID: ${doc.id}, Name: ${data.name || data.fullName}, Short: ${data.shortName}`);
        if (data.name === "Sagi Ramakrishnam Raju Engineering College" || data.fullName === "Sagi Ramakrishnam Raju Engineering College") {
            console.log("MATCH FOUND!");
            found = true;
        }
    });

    if (!found) {
        console.log("No document found with that full name.");
    }
}

checkSRREC().catch(console.error);
