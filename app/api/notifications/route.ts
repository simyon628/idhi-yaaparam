import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { getMessaging } from "firebase-admin/messaging";
import { getApps } from "firebase-admin/app";

export async function POST(req: Request) {
    try {
        const { targetUserId, title, body, link } = await req.json();
        
        if (!targetUserId || !title) {
            return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
        }

        const db = getAdminDb();
        const userDoc = await db.collection("users").doc(targetUserId).get();
        if (!userDoc.exists) {
            return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
        }

        const tokens = userDoc.data()?.fcmTokens || [];
        if (tokens.length === 0) {
            return NextResponse.json({ success: true, message: "No FCM tokens found for user" });
        }

        const adminApp = getApps()[0];
        const messaging = getMessaging(adminApp);

        const response = await messaging.sendEachForMulticast({
            tokens,
            notification: { title, body },
            webpush: {
                fcmOptions: { link }
            }
        });

        // Optional: cleanup dead tokens
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
            if (!resp.success) {
                const errCode = resp.error?.code;
                if (errCode === 'messaging/invalid-registration-token' ||
                    errCode === 'messaging/registration-token-not-registered') {
                    failedTokens.push(tokens[idx]);
                }
            }
        });

        if (failedTokens.length > 0) {
            // Remove failed tokens using FieldValue.arrayRemove
            const admin = await import('firebase-admin');
            await db.collection("users").doc(targetUserId).update({
                fcmTokens: admin.firestore.FieldValue.arrayRemove(...failedTokens)
            });
        }

        return NextResponse.json({ success: true, sentCount: response.successCount });
    } catch (error: any) {
        console.error("FCM Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
