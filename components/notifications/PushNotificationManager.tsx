"use client";

import { useEffect, useState } from 'react';
import { messaging, db, auth } from '@/lib/firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Bell, BellOff, Info } from 'lucide-react';
import { toast } from 'sonner';

export default function PushNotificationManager() {
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setPermission(Notification.permission);
        }

        // Listen for foreground messages
        if (messaging) {
            const unsubscribe = onMessage(messaging, (payload) => {
                console.log('Foreground message received:', payload);
                toast(payload.notification?.title || 'New Notification', {
                    description: payload.notification?.body,
                    icon: <Bell className="w-4 h-4 text-indigo-500" />,
                });
            });
            return () => unsubscribe();
        }
    }, []);

    const requestPermission = async () => {
        if (!('Notification' in window)) {
            toast.error("Notifications not supported in this browser");
            return;
        }

        setLoading(true);
        try {
            const status = await Notification.requestPermission();
            setPermission(status);

            if (status === 'granted' && messaging && auth?.currentUser) {
                const token = await getToken(messaging, {
                    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY // User needs to add this
                });

                if (token) {
                    console.log('FCM Token:', token);
                    // Save token to user profile
                    const userRef = doc(db as any, 'users', auth.currentUser.uid);
                    await updateDoc(userRef, {
                        pushTokens: arrayUnion(token)
                    });
                    toast.success("Push notifications enabled!");
                }
            } else if (status === 'denied') {
                toast.error("Notification permission denied");
            }
        } catch (error) {
            console.error('Notification error:', error);
            toast.error("Failed to enable notifications");
        } finally {
            setLoading(false);
        }
    };

    if (permission === 'granted') return null;

    return (
        <div className="fixed top-24 left-4 right-4 z-[60] animate-slide-up">
            <div className="bg-white/90 backdrop-blur-xl border border-indigo-100 p-4 rounded-3xl shadow-premium flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0">
                    <Bell className="w-6 h-6 text-indigo-500 animate-bounce-subtle" />
                </div>
                <div className="flex-1">
                    <h4 className="text-sm font-black text-slate-800 leading-tight">Enable Alerts?</h4>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">Get notified when someone wants to borrow your items.</p>
                </div>
                <button
                    onClick={requestPermission}
                    disabled={loading}
                    className="px-4 py-2 bg-indigo-600 text-white text-[10px] font-black rounded-xl uppercase tracking-widest shadow-indigo active:scale-95 transition-all disabled:opacity-50"
                >
                    {loading ? "..." : "Enable"}
                </button>
                <button 
                    onClick={() => setPermission('denied')}
                    className="p-2 text-slate-300 hover:text-slate-500"
                >
                    <BellOff className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
