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
    const fullName = "Sagi Ramakrishnam Raju Engineering College";
    
    console.log(`Searching for: "${fullName}"`);
    
    // Search by name
    const nameQuery = await db.collection('colleges').where('name', '==', fullName).get();
    if (!nameQuery.empty) {
        console.log(`Found by name! ID: ${nameQuery.docs[0].id}`);
    } else {
        console.log("Not found by exact name.");
        // Search by partial match
        const allColleges = await db.collection('colleges').get();
        let partialMatches = [];
        allColleges.forEach(doc => {
            const data = doc.data();
            if (data.name && data.name.includes("Sagi Ramakrishnam Raju")) {
                partialMatches.push({ id: doc.id, name: data.name });
            }
        });
        if (partialMatches.length > 0) {
            console.log("Partial matches found:", partialMatches);
        } else {
            console.log("No partial matches found either.");
        }
    }

    process.exit(0);
}

findSRREC();
