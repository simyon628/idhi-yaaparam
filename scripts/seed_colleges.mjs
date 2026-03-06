import { initializeApp } from "firebase/app";
import { getFirestore, collection, writeBatch, doc } from "firebase/firestore";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
    console.log("Reading CSV...");
    // Read the CSV exactly from where the user placed it
    const csvPath = path.resolve(__dirname, '../app/import-colleges/colleges.csv');
    if (!fs.existsSync(csvPath)) {
        console.error("❌ CSV file not found at:", csvPath);
        process.exit(1);
    }

    const csvText = fs.readFileSync(csvPath, 'utf8');

    const lines = csvText.split('\n');
    const colleges = [];

    let isFirst = true;
    for (const line of lines) {
        if (!line.trim()) continue;
        if (isFirst) {
            isFirst = false;
            continue; // Skip header
        }

        const parts = line.split(',');
        let name = "";
        let stateField = "";

        if (line.includes('"')) {
            const firstQuote = line.indexOf('"');
            const lastQuote = line.lastIndexOf('"');
            name = line.substring(firstQuote + 1, lastQuote).trim();

            const remaining = line.substring(lastQuote + 1).split(',');
            stateField = remaining[1] || remaining[0];
        } else {
            name = parts[1]?.trim();
            stateField = parts[2]?.trim();
        }

        if (name) {
            colleges.push({ name, state: stateField || "" });
        }
    }

    console.log(`Parsed ${colleges.length} colleges. Uploading sequentially to prevent Firebase connection hang...`);

    // We do smaller batches and await sequentially with slight delays to prevent open socket hangs
    const BATCH_SIZE = 100;
    let currentBatch = writeBatch(db);
    let count = 0;
    let batchesCommitted = 0;

    for (const college of colleges) {
        const newDocRef = doc(collection(db, "colleges"));
        currentBatch.set(newDocRef, {
            name: college.name,
            state: college.state,
            city: "",
            lat: 0,
            lng: 0,
            createdAt: new Date().toISOString()
        });
        count++;

        if (count === BATCH_SIZE) {
            await currentBatch.commit();
            batchesCommitted++;
            console.log(`Committed batch ${batchesCommitted} (${batchesCommitted * BATCH_SIZE} colleges)...`);
            count = 0;
            currentBatch = writeBatch(db);
            // Throttle to keep WebChannel from timing out
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    if (count > 0) {
        await currentBatch.commit();
        batchesCommitted++;
        console.log(`Committed final batch ${batchesCommitted}...`);
    }

    console.log(`✅ Successfully imported ${colleges.length} colleges directly!`);
    process.exit(0);
}

seed().catch(err => {
    console.error(err);
    process.exit(1);
});
