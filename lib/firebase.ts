import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: "G-C6FVQBN1F0"
};

// Safe initialization function
const initializeFirebase = () => {
  if (typeof window === "undefined" && !process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    return { app: null, auth: null, db: null, storage: null };
  }

  try {
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    const auth = getAuth(app);

    // Explicitly enforce local persistence for PWAs to survive app restarts
    if (typeof window !== "undefined") {
      import("firebase/auth").then(({ setPersistence, browserLocalPersistence }) => {
        setPersistence(auth, browserLocalPersistence).catch(console.error);
      });
    }

    return {
      app,
      auth,
      db: getFirestore(app),
      storage: getStorage(app),
    };
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    return { app: null, auth: null, db: null, storage: null };
  }
};

const { app, auth, db, storage } = initializeFirebase();

// Initialize Analytics safely on client side
let analytics;
if (typeof window !== "undefined" && app) {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, auth, db, storage, analytics };
