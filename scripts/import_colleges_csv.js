const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const readline = require('readline');
const path = require('path');

// ⚠️ We need the service account key to do this via admin SDK locally
// Alternatively we can just write a quick browser script if we don't have the key.
const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'admin-key.json');

async function importColleges() {
    if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
        console.error("❌ Need admin-key.json in the root directory to run the Admin SDK.");
        console.error("I'll generate a client-side import component instead.");
        return;
    }

    const serviceAccount = require(SERVICE_ACCOUNT_PATH);
    initializeApp({ credential: cert(serviceAccount) });
    const db = getFirestore();

    const fileStream = fs.createReadStream('C:\\Users\\SIMYON\\Downloads\\Indian_Engineering_Colleges_Dataset.csv');
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let isFirst = true;
    const batchArray = [];
    let currentBatch = db.batch();
    let count = 0;
    let totalCount = 0;

    for await (const line of rl) {
        if (isFirst) {
            isFirst = false;
            continue; // Skip header
        }

        // CSV parsing (Handling quotes)
        // Format: ,College_Name,State,,
        // e.g. 1,"College of Engineering, Anna University ",Tamil nadu,,

        let inQuotes = false;
        let start = 0;
        const parts = [];

        for (let i = 0; i < line.length; i++) {
            if (line[i] === '"') inQuotes = !inQuotes;
            if (line[i] === ',' && !inQuotes) {
                let segment = line.substring(start, i).replace(/(^"|"$)/g, '').trim();
                parts.push(segment);
                start = i + 1;
            }
        }
        parts.push(line.substring(start).replace(/(^"|"$)/g, '').trim());

        // parts[0] is the index
        // parts[1] is the name
        // parts[2] is the state

        const name = parts[1];
        const state = parts[2];

        if (!name) continue;

        const docRef = db.collection('colleges').doc();
        currentBatch.set(docRef, {
            name: name,
            state: state,
            city: "", // Not explicitly in CSV, usually embedded
            lat: 0,
            lng: 0,
            createdAt: new Date().toISOString()
        });

        count++;
        totalCount++;

        if (count === 400) {
            batchArray.push(currentBatch.commit());
            currentBatch = db.batch();
            count = 0;
            console.log(`Queued ${totalCount} colleges...`);
        }
    }

    if (count > 0) {
        batchArray.push(currentBatch.commit());
    }

    console.log(`Committing batches to Firestore for ${totalCount} colleges...`);
    await Promise.all(batchArray);
    console.log("✅ Successfully imported all colleges!");
}

importColleges().catch(console.error);
