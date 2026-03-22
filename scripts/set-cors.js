/**
 * One-time script to set Firebase Storage CORS rules.
 * Uses the service account from .env.local — no gsutil needed.
 * 
 * Usage: node scripts/set-cors.js
 */
const { Storage } = require('@google-cloud/storage');
const fs = require('fs');
const path = require('path');

// Read .env.local manually to avoid dotenv JSON parsing issues
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

// Extract the JSON value after FIREBASE_SERVICE_ACCOUNT_JSON=
const match = envContent.match(/FIREBASE_SERVICE_ACCOUNT_JSON=(.*)/);
if (!match) {
  console.error('Missing FIREBASE_SERVICE_ACCOUNT_JSON in .env.local');
  process.exit(1);
}

const raw = match[1].trim();
let creds;
try {
  creds = JSON.parse(raw);
} catch (e) {
  console.error('Failed to parse service account JSON:', e.message);
  process.exit(1);
}

const storage = new Storage({
  projectId: creds.project_id,
  credentials: creds,
});

// Read bucket from env
const bucketMatch = envContent.match(/NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=(.*)/);
const bucketName = bucketMatch ? bucketMatch[1].trim() : 'idhi-yaaparam.firebasestorage.app';
console.log('Using bucket:', bucketName);

async function setCors() {
  await storage.bucket(bucketName).setCorsConfiguration([
    {
      origin: ['*'],
      method: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE'],
      maxAgeSeconds: 3600,
      responseHeader: ['Content-Type', 'Access-Control-Allow-Origin', 'x-goog-resumable'],
    },
  ]);
  console.log('✅ CORS set successfully on gs://' + bucketName);
}

setCors().catch(err => {
  console.error('❌ Failed:', err.message);
  process.exit(1);
});
