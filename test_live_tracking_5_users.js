require('dotenv').config({ path: '.env.local' });
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, updateDoc, collection, addDoc, onSnapshot } = require('firebase/firestore');

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

const getDistanceM = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const toRad = x => x * Math.PI / 180;
    const a = Math.sin(toRad(lat2 - lat1) / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(toRad(lon2 - lon1) / 2) ** 2;
    return Math.floor(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

// Coordinates derived from SRKR campus area Overpass approximations
const CAMPUS_BLOCKS = [
    { name: "Main Block", lat: 16.5663, lng: 81.5230 },
    { name: "Library Block", lat: 16.5670, lng: 81.5238 },
    { name: "Mech Block", lat: 16.5655, lng: 81.5225 },
    { name: "CSE Block", lat: 16.5680, lng: 81.5240 },
    { name: "Hostels", lat: 16.5650, lng: 81.5250 }
];

async function run5UserSimulation() {
    console.log("🚀 Starting 5-User Dynamic Campus Block Tracking Simulation...\n");

    const users = [
        { id: "u1_owner_cse", name: "Alice (CSE Block)", block: CAMPUS_BLOCKS[3] },
        { id: "u2_owner_mech", name: "Bob (Mech Block)", block: CAMPUS_BLOCKS[2] },
        { id: "u3_owner_lib", name: "Charlie (Library)", block: CAMPUS_BLOCKS[1] },
        { id: "u4_renter_path", name: "Dave (Walking from Hostel to CSE)", block: CAMPUS_BLOCKS[4] },
        { id: "u5_renter_path", name: "Eve (Walking from Main to Mech)", block: CAMPUS_BLOCKS[0] }
    ];

    // 1. Setup users
    for (const u of users) {
        await setDoc(doc(db, "users", u.id), { name: u.name, isVerified: true });
    }
    console.log("✅ 5 Mock Users Created in Database.");

    // 2. Owners list items
    console.log("⌛ Owners listing 3 items across different Campus Blocks...");

    // Alice lists Drafter at CSE
    const item1Ref = await addDoc(collection(db, "rentals"), {
        ownerId: users[0].id, itemName: "Drafter", block: users[0].block.name, status: "available"
    });
    // Bob lists Casio at Mech
    const item2Ref = await addDoc(collection(db, "rentals"), {
        ownerId: users[1].id, itemName: "Casio Calculator", block: users[1].block.name, status: "available"
    });
    // Charlie lists Lab Coat at Library
    const item3Ref = await addDoc(collection(db, "rentals"), {
        ownerId: users[2].id, itemName: "Lab Coat", block: users[2].block.name, status: "available"
    });

    console.log("✅ Items listed dynamically at: CSE Block, Mech Block, Library Block !");

    // 3. Renters request items and Owners approve them
    console.log("\n⌛ Renters requesting items...");
    await updateDoc(doc(db, "rentals", item1Ref.id), { status: "active", renterId: users[3].id });
    console.log(`- Dave requested Alice's Drafter (Walking Hostel -> CSE)`);

    await updateDoc(doc(db, "rentals", item2Ref.id), { status: "active", renterId: users[4].id });
    console.log(`- Eve requested Bob's Calculator (Walking Main -> Mech)`);

    // 4. Set up Live Location Listeners (Mocking the UI radar)
    const activeRentals = [item1Ref.id, item2Ref.id];
    const unsubs = [];

    for (const rid of activeRentals) {
        const unsub = onSnapshot(doc(db, "rentals", rid), (snap) => {
            const data = snap.data();
            if (data.ownerLocation && data.renterLocation) {
                const dist = getDistanceM(data.ownerLocation.lat, data.ownerLocation.lng, data.renterLocation.lat, data.renterLocation.lng);
                console.log(`📡 [Live Tracking - ${data.itemName}] Distance: ${dist} meters`);
            }
        });
        unsubs.push(unsub);
    }

    console.log("\n🚦 SIMULATING REAL-TIME GPS MOVEMENT ACROSS CAMPUS...");

    let daveLat = users[3].block.lat;
    let daveLng = users[3].block.lng;

    let eveLat = users[4].block.lat;
    let eveLng = users[4].block.lng;

    for (let step = 1; step <= 5; step++) {
        console.log(`\n👣 Walking Step ${step}/5...`);

        // Dave walks from Hostel (lat: 16.5650, lng: 81.5250) towards CSE (lat: 16.5680, lng: 81.5240)
        daveLat += (users[0].block.lat - users[3].block.lat) / 5;
        daveLng += (users[0].block.lng - users[3].block.lng) / 5;

        // Eve walks from Main (lat: 16.5663, lng: 81.5230) towards Mech (lat: 16.5655, lng: 81.5225)
        eveLat += (users[1].block.lat - users[4].block.lat) / 5;
        eveLng += (users[1].block.lng - users[4].block.lng) / 5;

        // Push updates to Firestore concurrently
        await Promise.all([
            // Alice (Owner 1) stationary at CSE
            updateDoc(doc(db, "rentals", item1Ref.id), { ownerLocation: { lat: users[0].block.lat, lng: users[0].block.lng } }),
            // Dave (Renter 1) moving
            updateDoc(doc(db, "rentals", item1Ref.id), { renterLocation: { lat: daveLat, lng: daveLng } }),

            // Bob (Owner 2) stationary at Mech
            updateDoc(doc(db, "rentals", item2Ref.id), { ownerLocation: { lat: users[1].block.lat, lng: users[1].block.lng } }),
            // Eve (Renter 2) moving
            updateDoc(doc(db, "rentals", item2Ref.id), { renterLocation: { lat: eveLat, lng: eveLng } })
        ]);

        await delay(1500);
    }

    console.log("\n🎉 Tracking complete! Both sets of users crossed different blocks successfully via DB tracking.");
    unsubs.forEach(u => u());
    process.exit(0);
}

run5UserSimulation().catch(console.error);
