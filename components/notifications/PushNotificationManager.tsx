"use client";

import { useEffect, useState } from 'react';
import { messaging, db, auth } from '@/lib/firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Bell, X } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { onAuthStateChanged } from 'firebase/auth';

export default function PushNotificationManager() {
    const [permission, setPermission] = useState<NotificationPermission | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [dismissed, setDismissed] = useState(false);

    // Only show for logged-in users
    useEffect(() => {
        if (!auth) return;
        const unsub = onAuthStateChanged(auth, (user) => {
            setUserId(user?.uid ?? null);
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setPermission(Notification.permission);
        }

        // Listen for foreground messages (silent in-app toasts)
        if (messaging) {
            const unsubscribe = onMessage(messaging, (payload) => {
                toast(payload.notification?.title || 'New Notification', {
                    description: payload.notification?.body,
                    icon: <Bell className="w-4 h-4 text-indigo-500" />,
                });
            });
            return () => unsubscribe();
        }
    }, []);

    const requestPermission = async () => {
        if (!('Notification' in window)) return;
        const status = await Notification.requestPermission();
        setPermission(status);
        setDismissed(true);

        if (status === 'granted' && messaging && db && userId) {
            try {
                const token = await getToken(messaging, {
                    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
                });
                if (token) {
                    const userRef = doc(db as any, 'users', userId);
                    await updateDoc(userRef, { pushTokens: arrayUnion(token) });
                    toast.success("You'll be notified when someone wants to borrow your items!");
                }
            } catch (e) {
                // Silently fail — notifications are a nice-to-have
                console.warn('Push token registration failed:', e);
            }
        }
    };

    // Don't show if: no user, already granted/denied, or user dismissed
    const shouldShow = userId && permission === 'default' && !dismissed;

    return (
        <AnimatePresence>
            {shouldShow && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10, scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 35, delay: 2 }}
                    className="absolute top-[68px] left-3 right-3 z-30"
                >
                    <div className="bg-white/95 backdrop-blur-md border border-indigo-100 rounded-2xl px-4 py-3 shadow-lg flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                            <Bell className="w-4 h-4 text-indigo-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-black text-slate-700">Enable borrow alerts?</p>
                            <p className="text-[10px] text-slate-400 font-medium leading-tight">Get notified when someone wants your items.</p>
                        </div>
                        <button
                            onClick={requestPermission}
                            className="shrink-0 px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-black rounded-xl uppercase tracking-wider active:scale-95 transition-all shadow-indigo"
                        >
                            Enable
                        </button>
                        <button
                            onClick={() => setDismissed(true)}
                            className="shrink-0 p-1 text-slate-300 hover:text-slate-500 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
