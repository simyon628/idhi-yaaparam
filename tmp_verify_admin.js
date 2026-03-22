const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

async function verifyData() {
    console.log("Starting data integrity check with firebase-admin...");
    
    let serviceAccount;
    try {
        const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
        if (!json) throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_JSON");
        
        // Use the same logic as in lib/firebaseAdmin.ts
        const unescapedJson = json.replace(/\\n/g, '\n');
        serviceAccount = JSON.parse(unescapedJson);
    } catch (e) {
        console.error("Failed to parse service account:", e.message);
        // Try without replacement if it failed
        try {
            serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        } catch (e2) {
             console.error("Second attempt failed:", e2.message);
             process.exit(1);
        }
    }

    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    }

    const db = admin.firestore();
    const collections = ['rentals', 'users', 'colleges', 'categories'];
    const results = {};
    let anyEmpty = false;

    for (const colName of collections) {
        try {
            const snapshot = await db.collection(colName).limit(1).get();
            const isEmpty = snapshot.empty;
            results[colName] = isEmpty ? 'EMPTY' : 'HAS DATA';
            console.log(`Collection '${colName}': ${isEmpty ? 'EMPTY' : 'HAS DATA'}`);
            if (isEmpty) anyEmpty = true;
        } catch (e) {
            console.error(`Failed to check collection '${colName}':`, e.message);
        }
    }

    // Specifically check for SRREC
    try {
        const srrecDoc = await db.collection('colleges').doc('SRREC').get();
        if (srrecDoc.exists) {
            console.log("College 'SRREC' found by ID.");
        } else {
            const query = await db.collection('colleges').where('shortName', '==', 'SRREC').get();
            if (!query.empty) {
                console.log("College 'SRREC' found by shortName.");
            } else {
                console.log("College 'SRREC' NOT found!");
            }
        }
    } catch (e) {
        console.error("Error checking for SRREC:", e.message);
    }

    if (anyEmpty) {
        console.log("ALERT: One or more collections are empty!");
    } else {
        console.log("Core collections have data.");
    }

    process.exit(0);
}

verifyData();
