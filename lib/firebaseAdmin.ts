/**
 * lib/firebaseAdmin.ts
 * Server-side Firebase Admin SDK — used by Next.js API routes.
 * 
 * Requires the env var: FIREBASE_SERVICE_ACCOUNT_JSON
 * Value = the raw JSON content of your Firebase service account key.
 */

import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

let adminApp: App;
let adminDb: Firestore;
let adminAuth: Auth;

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // Option 1: Individual Env Vars (easier for Vercel manual entry)
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // Vercel sometimes escapes "\n", so we replace it with actual newlines
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }

  // Option 2: Full JSON Payload string
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    throw new Error(
      'Missing FIREBASE_SERVICE_ACCOUNT_JSON or (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) environment variables.'
    );
  }

  let serviceAccount;
  try {
    const unescapedJson = serviceAccountJson.replace(/\\n/g, '\n');
    serviceAccount = JSON.parse(unescapedJson);
  } catch (error: any) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:", error);
    throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT_JSON formatting.");
  }

  return initializeApp({
    credential: cert(serviceAccount),
  });
}

export function getAdminDb(): Firestore {
  if (!adminDb) {
    adminApp = getAdminApp();
    adminDb = getFirestore(adminApp);
  }
  return adminDb;
}

export function getAdminAuth(): Auth {
  if (!adminAuth) {
    // If adminApp isn't initialized yet, getAdminApp() will do it
    const app = getAdminApp();
    adminAuth = getAuth(app);
  }
  return adminAuth;
}
