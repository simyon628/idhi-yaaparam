require('dotenv').config({ path: '.env.local' });
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

const MOCK_CATEGORIES = [
    { id: "cat-bikes", name: "Bikes & Scooters", icon: "🚲", color: "bg-blue-50 text-blue-600" },
    { id: "cat-books", name: "Textbooks", icon: "📚", color: "bg-indigo-50 text-indigo-600" },
    { id: "cat-electronics", name: "Electronics", icon: "💻", color: "bg-purple-50 text-purple-600" },
    { id: "cat-tools", name: "Lab Tools (ED, Drafter)", icon: "📐", color: "bg-orange-50 text-orange-600" },
];

const MOCK_LISTINGS = [
    {
        title: "Honda Dio - Good Condition",
        description: "Available for rent this weekend. Good mileage.",
        price: 300,
        priceUnit: "per_day",
        categoryId: "cat-bikes",
        ownerId: "mock-user-1",
        ownerName: "Rahul Y.",
        collegeId: "mock-college-srkr", // Placeholder
        blockId: "mock-block-cse",
        images: ["https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=500&auto=format&fit=crop&q=60"],
        status: "available"
    },
    {
        title: "M1 & M2 Textbooks (JNTUK)",
        description: "Latest edition, very clean pages.",
        price: 50,
        priceUnit: "per_month",
        categoryId: "cat-books",
        ownerId: "mock-user-2",
        ownerName: "Sneha K.",
        collegeId: "mock-college-srkr",
        blockId: "mock-block-ece",
        images: ["https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&auto=format&fit=crop&q=60"],
        status: "available"
    },
    {
        title: "Scientific Calculator Casio FX-991EX",
        description: "Required for finals. Perfect working condition.",
        price: 20,
        priceUnit: "per_day",
        categoryId: "cat-electronics",
        ownerId: "mock-user-3",
        ownerName: "Varun S.",
        collegeId: "mock-college-srkr",
        blockId: "mock-block-mech",
        images: ["https://images.unsplash.com/photo-1574607383476-f517f260d30b?w=500&auto=format&fit=crop&q=60"],
        status: "available"
    },
    {
        title: "Mini Drafter + Geometry Box",
        description: "Engineering Drawing kit. Renting out since my lab is over.",
        price: 100,
        priceUnit: "per_semester",
        categoryId: "cat-tools",
        ownerId: "mock-user-1",
        ownerName: "Rahul Y.",
        collegeId: "mock-college-srkr",
        blockId: "mock-block-cse",
        images: ["https://images.unsplash.com/photo-1611078709590-7d3c0a5e8cd0?w=500&auto=format&fit=crop&q=60"],
        status: "available"
    }
];

async function seedMocks() {
    try {
        console.log("Seeding Mock Categories...");
        const batch = writeBatch(db);

        // 1. Categories
        for (const cat of MOCK_CATEGORIES) {
            const ref = doc(db, "categories", cat.id);
            batch.set(ref, cat);
        }

        // 2. Listings
        const listingsRef = collection(db, "listings");
        for (const listing of MOCK_LISTINGS) {
            const ref = doc(listingsRef);
            batch.set(ref, {
                ...listing,
                id: ref.id,
                createdAt: new Date().toISOString()
            });
        }

        await batch.commit();
        console.log("✅ Successfully seeded Categories and mock Listings!");
        process.exit(0);
    } catch (e) {
        console.error("❌ Seeding failed. Firebase error:", e.message);
        console.error("Ensure you have clicked 'Create Database' in your Firebase console.");
        process.exit(1);
    }
}

seedMocks();
