require('dotenv').config({ path: '.env.local' });
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc } = require('firebase/firestore');

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

async function removeDuplicates() {
    try {
        console.log("Fetching all colleges...");
        const snapshot = await getDocs(collection(db, "colleges"));

        const nameMap = new Map();
        let deleteCount = 0;

        for (const docSnap of snapshot.docs) {
            const data = docSnap.data();
            const lowerName = data.name.toLowerCase().trim();

            if (nameMap.has(lowerName)) {
                // Duplicate found
                await deleteDoc(docSnap.ref);
                deleteCount++;
                if (deleteCount % 50 === 0) console.log(`Deleted ${deleteCount} duplicates...`);
            } else {
                nameMap.set(lowerName, docSnap.id);
            }
        }

        console.log(`✅ Finished! Removed ${deleteCount} duplicate colleges.`);
        process.exit(0);
    } catch (e) {
        console.error("Failed to remove duplicates:", e);
        process.exit(1);
    }
}

removeDuplicates();
