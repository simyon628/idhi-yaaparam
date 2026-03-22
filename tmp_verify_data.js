require('dotenv').config({ path: '.env.local' });
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

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

async function verifyData() {
    const collections = ['rentals', 'users', 'colleges', 'categories'];
    const results = {};
    let anyEmpty = false;

    console.log("Starting data integrity check...");

    for (const colName of collections) {
        try {
            const querySnapshot = await getDocs(collection(db, colName));
            const count = querySnapshot.size;
            results[colName] = count;
            console.log(`Collection '${colName}': ${count} documents`);
            if (count === 0) anyEmpty = true;
        } catch (e) {
            console.error(`Failed to fetch collection '${colName}':`, e.message);
            results[colName] = 'ERROR';
        }
    }

    if (anyEmpty) {
        console.log("ALERT: One or more collections are empty!");
    } else {
        console.log("All requested collections have data.");
    }
    
    // Check specifically for SRREC in colleges
    try {
        const collegesSnapshot = await getDocs(collection(db, 'colleges'));
        let srrecFound = false;
        collegesSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.name && data.name.includes('SRREC')) srrecFound = true;
            if (data.shortName && data.shortName.includes('SRREC')) srrecFound = true;
            if (doc.id === 'SRREC') srrecFound = true;
        });
        console.log(`SRREC found in colleges: ${srrecFound}`);
    } catch (e) {
        console.error("Failed to check for SRREC:", e.message);
    }

    process.exit(0);
}

verifyData();
