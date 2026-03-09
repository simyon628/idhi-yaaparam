"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot, writeBatch, doc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { ChevronLeft, Loader2, Bell, CheckCircle2, AlertTriangle, ArrowRight, MessageSquare } from "lucide-react";
import { AppNotification } from "@/lib/types";

export default function NotificationsPage() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null | undefined>(undefined); // undefined = still checking

    useEffect(() => {
        if (!auth) { setUserId(null); setLoading(false); return; }
        const unsub = onAuthStateChanged(auth as any, (user) => {
            setUserId(user?.uid ?? null);
            if (!user) setLoading(false);
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        if (!userId || !db) return;

        const q = query(
            collection(db as any, "notifications"),
            where("userId", "==", userId),
            orderBy("createdAt", "desc")
        );

        const unsub = onSnapshot(q, (snapshot) => {
            const notifs: AppNotification[] = [];
            snapshot.forEach(d => {
                notifs.push({ id: d.id, ...d.data() } as AppNotification);
            });
            setNotifications(notifs);
            setLoading(false);

            // Mark all as read when viewed
            const unread = snapshot.docs.filter(d => !d.data().isRead);
            if (unread.length > 0) {
                const batch = writeBatch(db as any);
                unread.forEach(d => {
                    batch.update(doc(db as any, "notifications", d.id), { isRead: true });
                });
                batch.commit().catch(console.error);
            }
        });

        return () => unsub();
    }, [userId]);

    const getIcon = (type: string) => {
        switch (type) {
            case "request": return <ArrowRight className="w-5 h-5 text-indigo-500" />;
            case "approval": return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
            case "warning": return <AlertTriangle className="w-5 h-5 text-rose-500" />;
            case "message": return <MessageSquare className="w-5 h-5 text-blue-500" />;
            default: return <Bell className="w-5 h-5 text-slate-400" />;
        }
    };

    if (!userId && !loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-slate-50 px-5 text-center">
                <h2 className="text-xl font-black text-slate-800">Please Sign In</h2>
            </div>
        );
    }

    if (loading) {
        return <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-slate-50 relative pb-24"><Loader2 className="w-8 h-8 animate-spin text-indigo-400" /></div>;
    }

    return (
        <div className="flex-1 flex flex-col min-h-screen bg-slate-50 relative pb-24">
            <header className="fixed top-0 w-full z-40 bg-white/80 backdrop-blur-xl border-b border-indigo-100 px-5 pt-12 pb-4 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="p-2 bg-slate-50 border border-slate-200 rounded-xl active:scale-95 transition-all text-slate-500">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-slate-800 flex items-center gap-1.5" style={{ fontFamily: "Outfit, sans-serif" }}>
                            Notifications
                        </h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Your Activity Feed</p>
                    </div>
                </div>
            </header>

            <main className="flex-1 pt-[100px] px-5 space-y-3">
                {notifications.length === 0 ? (
                    <div className="text-center py-16">
                        <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-semibold text-sm">You have no notifications.</p>
                    </div>
                ) : (
                    notifications.map((notif) => (
                        <div
                            key={notif.id}
                            onClick={() => {
                                if (notif.link) router.push(notif.link);
                            }}
                            className={`p-4 rounded-2xl border transition-all ${notif.isRead ? "bg-white border-slate-100 shadow-sm" : "bg-indigo-50 border-indigo-100 shadow-md"} ${notif.link ? "cursor-pointer active:scale-[0.98] hover:shadow-lg" : ""}`}
                        >
                            <div className="flex gap-4 items-start">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notif.isRead ? "bg-slate-50" : "bg-white"}`}>
                                    {getIcon(notif.type)}
                                </div>
                                <div>
                                    <h3 className={`text-[15px] leading-tight mb-1 ${notif.isRead ? "font-bold text-slate-700" : "font-black text-slate-900"}`}>{notif.title}</h3>
                                    <p className="text-sm text-slate-600 font-medium leading-relaxed">{notif.message}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                                        {notif.createdAt ? new Date((notif.createdAt as any).seconds * 1000).toLocaleString() : "Just now"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </main>
        </div>
    );
}
