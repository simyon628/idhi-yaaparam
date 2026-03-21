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
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    console.warn("Firebase API key is missing. Firebase features will be disabled safely.");
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

// Initialize Analytics & Messaging safely on client side
let analytics;
let messaging: any = null;

if (typeof window !== "undefined" && app) {
  // Analytics
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});

  // FCM Messaging — only load in browsers that support it (requires HTTPS + SW)
  import("firebase/messaging").then(({ getMessaging, isSupported: isMsgSupported }) => {
    isMsgSupported().then((supported: boolean) => {
      if (supported) {
        try {
          messaging = getMessaging(app);
        } catch {
          // FCM unavailable in this context (e.g. incognito, Safari) — silently skip
        }
      }
    }).catch(() => {});
  }).catch(() => {});
}

export { app, auth, db, storage, analytics, messaging };
