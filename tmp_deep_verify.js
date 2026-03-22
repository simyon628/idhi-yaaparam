const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

async function verifyAll() {
    console.log("Deep verification starting...");
    
    let serviceAccount;
    try {
        const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
        // The issue is likely that the env var is wrapped in quotes or has escaped characters that JSON.parse doesn't like when coming from dotenv
        // Let's try to just use the JSON as is, but handle the private_key specifically if needed.
        serviceAccount = JSON.parse(json);
    } catch (e) {
        try {
            // Try to fix common dotenv/JSON issues
            let json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
            if (json.startsWith("'") && json.endsWith("'")) json = json.slice(1, -1);
            if (json.startsWith('"') && json.endsWith('"')) json = json.slice(1, -1);
            serviceAccount = JSON.parse(json);
        } catch (e2) {
            console.error("Failed to parse service account JSON:", e2.message);
            process.exit(1);
        }
    }

    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    }

    const db = admin.firestore();
    
    // 1. Check collections
    const collections = ['rentals', 'users', 'colleges', 'categories'];
    for (const col of collections) {
        const snap = await db.collection(col).limit(1).get();
        console.log(`Collection ${col}: ${snap.empty ? 'EMPTY' : 'OK'}`);
    }

    // 2. Search for SRREC in colleges
    console.log("Searching for SRREC in colleges...");
    const collegesSnap = await db.collection('colleges').get();
    let foundCol = false;
    collegesSnap.forEach(doc => {
        const data = doc.data();
        const str = JSON.stringify(data).toUpperCase();
        if (str.includes('SRREC') || doc.id.toUpperCase().includes('SRREC')) {
            console.log(`FOUND college: ID=${doc.id}, Name=${data.name}`);
            foundCol = true;
        }
    });

    // 3. Search for SRREC in users
    console.log("Searching for SRREC association in users...");
    const usersSnap = await db.collection('users').get();
    let foundUser = false;
    usersSnap.forEach(doc => {
        const data = doc.data();
        const str = JSON.stringify(data).toUpperCase();
        if (str.includes('SRREC')) {
            console.log(`FOUND user association: ID=${doc.id}, College=${data.college || data.collegeName}`);
            foundUser = true;
        }
    });

    if (!foundCol && !foundUser) {
        console.log("RESULT: SRREC not found in colleges or users.");
    }

    process.exit(0);
}

verifyAll();
