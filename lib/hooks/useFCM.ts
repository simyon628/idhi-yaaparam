"use client";

import { useEffect, useRef } from "react";
import { messaging, db, auth } from "@/lib/firebase";
import { getToken } from "firebase/messaging";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";

export function useFCM() {
    const hasRequested = useRef(false);

    useEffect(() => {
        if (typeof window === "undefined" || !messaging || !auth?.currentUser) return;
        if (hasRequested.current) return;
        hasRequested.current = true;

        async function requestPushPermission() {
            try {
                const permission = await Notification.requestPermission();
                if (permission === "granted") {
                    // Try to get token — user must set NEXT_PUBLIC_FIREBASE_VAPID_KEY in .env
                    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
                    if (!vapidKey) {
                        console.warn("FCM vapidKey missing. Skipping token generation.");
                        return;
                    }

                    const token = await getToken(messaging, { vapidKey });
                    if (token && auth?.currentUser) {
                        await updateDoc(doc(db as any, "users", auth.currentUser.uid), {
                            fcmTokens: arrayUnion(token)
                        });
                        console.log("FCM Token saved safely.");
                    }
                }
            } catch (error) {
                console.error("FCM Token fetch failed:", error);
            }
        }

        requestPushPermission();
    }, []);
}
