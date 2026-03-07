require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, writeBatch, doc } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
    try {
        console.log("Reading CSV...");
        const csvPath = 'public/colleges.csv';
        if (!fs.existsSync(csvPath)) {
            console.error("Colleges CSV not found at public/colleges.csv");
            process.exit(1);
        }

        const csvText = fs.readFileSync(csvPath, 'utf-8');
        const lines = csvText.split('\n');

        const collegesData = [];
        let isFirst = true;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (!line.trim()) continue;
            if (isFirst) {
                isFirst = false;
                continue;
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
                collegesData.push({ name, state: stateField || "" });
            }
        }

        console.log(`Parsed ${collegesData.length} colleges. Starting Firestore batches...`);

        const BATCH_SIZE = 450;
        const chunks = [];
        for (let i = 0; i < collegesData.length; i += BATCH_SIZE) {
            chunks.push(collegesData.slice(i, i + BATCH_SIZE));
        }

        let importedCount = 0;
        const collegesRef = collection(db, "colleges");

        for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
            const chunk = chunks[chunkIndex];
            const batch = writeBatch(db);

            for (const col of chunk) {
                const newDocRef = doc(collegesRef);
                batch.set(newDocRef, {
                    id: newDocRef.id,
                    name: col.name,
                    state: col.state,
                    city: "",
                    lat: 0,
                    lng: 0,
                    createdAt: new Date().toISOString()
                });
            }

            await batch.commit();
            importedCount += chunk.length;
            console.log(`Batch ${chunkIndex + 1}/${chunks.length} committed. Total: ${importedCount}`);
        }

        console.log("✅ Seed complete!");
        process.exit(0);
    } catch (e) {
        console.error("Seed failed:", e);
        process.exit(1);
    }
}

seed();
