require('dotenv').config({ path: '.env.local' });
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc, collection, onSnapshot, query, where } = require('firebase/firestore');

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

const delay = ms => new Promise(res => setTimeout(res, ms));

const CAMPUS_BLOCKS = {
    MOCK_START: { lat: 16.5650, lng: 81.5250 }, // Hostel
    ALICE_POS: { lat: 16.5680, lng: 81.5240 }    // CSE
};

async function runMockRenter() {
    console.log("🚀 Background Renter Simulator started...");
    console.log("Waiting for Alice to list 'Sci-Fi Calculator'...");

    const rentalsRef = collection(db, "rentals");
    let trackingStarted = false;

    const unsub = onSnapshot(rentalsRef, async (snap) => {
        snap.docChanges().forEach(async (change) => {
            const data = change.doc.data();
            const id = change.doc.id;

            // Phase 1: Item Listed -> Request it
            if (change.type === "added" && data.itemName.includes("Sci-Fi") && data.status === "available") {
                console.log(`\n✅ Alice listed: ${data.itemName}!`);
                console.log("Waiting 3 seconds before Dave requests it...");
                await delay(3000);

                await updateDoc(doc(db, "rentals", id), {
                    status: "requested",
                    renterId: "mock_dave_123" // Fake User B
                });
                console.log("📱 Dave has requested the item! Waiting for Alice to approve...");
            }

            // Phase 2: Alice Approved -> Start Walking
            if (data.status === "active" && !trackingStarted && data.renterId === "mock_dave_123") {
                trackingStarted = true;
                console.log("\n✅ Alice APPROVED the request! Dave is now walking towards Alice...");

                let daveLat = CAMPUS_BLOCKS.MOCK_START.lat;
                let daveLng = CAMPUS_BLOCKS.MOCK_START.lng;

                // Dave walks in 15 steps
                const STEPS = 15;
                for (let i = 1; i <= STEPS; i++) {
                    daveLat += (CAMPUS_BLOCKS.ALICE_POS.lat - CAMPUS_BLOCKS.MOCK_START.lat) / STEPS;
                    daveLng += (CAMPUS_BLOCKS.ALICE_POS.lng - CAMPUS_BLOCKS.MOCK_START.lng) / STEPS;

                    try {
                        await updateDoc(doc(db, "rentals", id), {
                            renterLocation: { lat: daveLat, lng: daveLng },
                            ownerLocation: CAMPUS_BLOCKS.ALICE_POS
                        });
                        console.log(`👣 Step ${i}/${STEPS} - Dave moving closer...`);
                    } catch (e) { }

                    await delay(1200); // 1.2s per step
                }
                console.log("🎉 Dave has arrived! Simulation complete.");
                process.exit(0);
            }
        });
    });
}

runMockRenter().catch(console.error);
