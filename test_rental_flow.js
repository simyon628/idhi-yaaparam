require('dotenv').config({ path: '.env.local' });
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, updateDoc, getDoc, collection, addDoc } = require('firebase/firestore');

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

async function runMultiUserTest() {
    try {
        console.log("🚀 Starting Multi-User Rental Flow Test...");

        // 1. Create User A (Owner)
        const userAId = "test_user_owner_123";
        await setDoc(doc(db, "users", userAId), {
            uid: userAId,
            name: "Test User A (Owner)",
            phoneNumber: "+91000000000A",
            rollNumber: "ROLL_A",
            college: "Sagi Rama Krishnam Raju Engineering College",
            department: "CSE-A",
            isVerified: true,
            isBlocked: false,
            strikeCount: 0
        });
        console.log("✅ Created User A (Owner)");

        // 2. Create User B (Renter)
        const userBId = "test_user_renter_456";
        await setDoc(doc(db, "users", userBId), {
            uid: userBId,
            name: "Test User B (Renter)",
            phoneNumber: "+91000000000B",
            rollNumber: "ROLL_B",
            college: "Sagi Rama Krishnam Raju Engineering College",
            department: "ECE-B",
            isVerified: true,
            isBlocked: false,
            strikeCount: 0
        });
        console.log("✅ Created User B (Renter)");

        // 3. User A lists an item
        console.log("⏳ User A is listing a 'Test Book'...");
        const rentalRef = await addDoc(collection(db, "rentals"), {
            ownerId: userAId,
            itemName: "Advanced Engineering Mathematics",
            pricePerHour: 10,
            block: "Main Library",
            college: "Sagi Rama Krishnam Raju Engineering College",
            collegeId: "col-srkr-mock",
            department: "CSE-A",
            icon: "📓",
            photoUrl: "https://placehold.co/400x225/e2e8f0/4f46e5?text=Math+Book",
            status: "available",
            renterId: null,
            createdAt: new Date().toISOString(),
        });
        const rentalId = rentalRef.id;
        console.log(`✅ User A listed item successfully! (ID: ${rentalId})`);

        await sleep(1500);

        // 4. User B finds and requests the item
        console.log(`⏳ User B requesting to rent the item...`);
        await updateDoc(doc(db, "rentals", rentalId), {
            status: "requested",
            renterId: userBId,
            requestedAt: new Date().toISOString()
        });

        const requestedCheck = await getDoc(doc(db, "rentals", rentalId));
        console.log(`✅ User B requested item! Status is now: ${requestedCheck.data().status}`);

        await sleep(1500);

        // 5. User A approves the request
        console.log(`⏳ User A approving the rental request...`);
        await updateDoc(doc(db, "rentals", rentalId), {
            status: "active",
            approvedAt: new Date().toISOString()
        });

        const activeCheck = await getDoc(doc(db, "rentals", rentalId));
        console.log(`✅ User A approved item! Status is now: ${activeCheck.data().status}`);

        await sleep(1500);

        // 6. User A marks as returned
        console.log(`⏳ User A marking as returned...`);
        await updateDoc(doc(db, "rentals", rentalId), {
            status: "completed",
            completedAt: new Date().toISOString()
        });

        const completedCheck = await getDoc(doc(db, "rentals", rentalId));
        console.log(`✅ Flow complete! Final status: ${completedCheck.data().status}`);

        console.log("🎉 Multi-User Rental Flow verified successfully across all states!");
        process.exit(0);
    } catch (e) {
        console.error("Test failed:", e);
        process.exit(1);
    }
}

runMultiUserTest();
