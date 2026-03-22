const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

async function checkUsersForCollege() {
    let serviceAccount;
    try {
        const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
        const unescapedJson = json.replace(/\\n/g, '\n');
        serviceAccount = JSON.parse(unescapedJson);
    } catch (e) {
        process.exit(1);
    }

    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    }

    const db = admin.firestore();
    const usersSnapshot = await db.collection('users').get();
    
    console.log(`Total users: ${usersSnapshot.size}`);
    const collegeCounts = {};
    
    usersSnapshot.forEach(doc => {
        const data = doc.data();
        const college = data.college || data.collegeName || data.collegeId;
        if (college) {
            collegeCounts[college] = (collegeCounts[college] || 0) + 1;
        }
    });
    
    console.log("Colleges associated with users:", collegeCounts);

    process.exit(0);
}

checkUsersForCollege();
