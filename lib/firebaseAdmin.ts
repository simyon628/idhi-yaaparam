/**
 * lib/firebaseAdmin.ts
 * Server-side Firebase Admin SDK — used by Next.js API routes.
 * 
 * Requires the env var: FIREBASE_SERVICE_ACCOUNT_JSON
 * Value = the raw JSON content of your Firebase service account key.
 */

import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App;
let adminDb: Firestore;

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    throw new Error(
      'Missing FIREBASE_SERVICE_ACCOUNT_JSON environment variable. ' +
      'Add it to your .env.local (local) and Vercel dashboard (production).'
    );
  }

  const serviceAccount = JSON.parse(serviceAccountJson);

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
