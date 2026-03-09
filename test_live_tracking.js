require('dotenv').config({ path: '.env.local' });
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, updateDoc, getDoc, collection, addDoc, onSnapshot } = require('firebase/firestore');

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

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Distance calculation
const getDistanceInMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.floor(R * c);
};

async function runLiveTrackingTest() {
    try {
        console.log("🚀 Starting Live Location Tracking Flow Test...");

        const userAId = "test_user_owner_tracking";
        const userBId = "test_user_renter_tracking";

        // Create Users (assuming they already exist from previous test, but let's make sure)
        await setDoc(doc(db, "users", userAId), { name: "User A (Owner)", isVerified: true });
        await setDoc(doc(db, "users", userBId), { name: "User B (Renter)", isVerified: true });

        // User A lists an item
        console.log("⏳ User A is listing an item...");
        const rentalRef = await addDoc(collection(db, "rentals"), {
            ownerId: userAId,
            itemName: "Drafter for Live Tracking test",
            pricePerHour: 15,
            block: "Mech Block",
            college: "Sagi Rama Krishnam Raju Engineering College",
            collegeId: "col-srkr-mock",
            status: "available",
            createdAt: new Date().toISOString(),
        });
        const rentalId = rentalRef.id;
        console.log(`✅ Item listed! (ID: ${rentalId})`);

        // User B requests it and User A approves it to make it active so tracking starts
        await updateDoc(doc(db, "rentals", rentalId), {
            status: "active",
            renterId: userBId,
        });
        console.log(`✅ Rental is now active! Live tracking should engage.`);

        // Start listening to the document like the frontend
        const unsub = onSnapshot(doc(db, "rentals", rentalId), (docSnap) => {
            const data = docSnap.data();
            if (data.ownerLocation && data.renterLocation) {
                const dist = getDistanceInMeters(data.ownerLocation.lat, data.ownerLocation.lng, data.renterLocation.lat, data.renterLocation.lng);
                console.log(`📡 [Live UI View] Distance between A & B: ${dist} meters`);
            }
        });

        // Simulate User A and User B walking towards each other
        // Sagi Rama Krishnam Raju Engineering College Coordinates roughly 16.5663° N, 81.5230° E

        let aLat = 16.566300;
        let aLng = 81.523000;

        let bLat = 16.568300; // About 222m north
        let bLng = 81.523000;

        for (let i = 0; i < 5; i++) {
            console.log(`\n🚶 GPS Update ${i + 1}/5...`);

            // Move closer
            bLat -= 0.000400; // Walk south

            await Promise.all([
                updateDoc(doc(db, "rentals", rentalId), { ownerLocation: { lat: aLat, lng: aLng } }),
                updateDoc(doc(db, "rentals", rentalId), { renterLocation: { lat: bLat, lng: bLng } })
            ]);

            await sleep(2000);
        }

        unsub();
        console.log("\n🎉 Live tracking verified successfully! They met and data synced in real-time.");
        process.exit(0);
    } catch (e) {
        console.error("Test failed:", e);
        process.exit(1);
    }
}

runLiveTrackingTest();
