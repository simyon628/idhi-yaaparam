"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "sonner";
import {
    ChevronLeft, Loader2, Package, IndianRupee, Clock,
    CheckCircle2, XCircle
} from "lucide-react";
import { Listing } from "@/lib/types";
import { TopBar } from "@/components/layout/TopBar";

export default function HistoryPage() {
    const router = useRouter();
    const [history, setHistory] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null | undefined>(undefined);

    // Async auth state check
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

        const fetchHistory = async () => {
            try {
                // Fetch listings where user is owner
                const ownerQ = query(
                    collection(db as any, "rentals"),
                    where("ownerId", "==", userId)
                );

                // Fetch listings where user is renter
                const renterQ = query(
                    collection(db as any, "rentals"),
                    where("renterId", "==", userId)
                );

                const [ownerSnap, renterSnap] = await Promise.all([
                    getDocs(ownerQ),
                    getDocs(renterQ)
                ]);

                const mapDocs = (snap: any) => snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Listing));

                const combined = [...mapDocs(ownerSnap), ...mapDocs(renterSnap)];

                // Deduplicate (incase user rented their own item somehow)
                const uniqueMap = new Map<string, Listing>();
                combined.forEach(item => uniqueMap.set(item.id, item));
                const uniqueListings = Array.from(uniqueMap.values());

                // Filter for completed or cancelled
                const completedHistory = uniqueListings.filter(
                    item => item.status === "completed" || item.status === "cancelled"
                );

                // Sort by createdAt desc
                completedHistory.sort((a, b) => {
                    const timeA = (a.createdAt as any)?.toMillis?.() || 0;
                    const timeB = (b.createdAt as any)?.toMillis?.() || 0;
                    return timeB - timeA;
                });

                setHistory(completedHistory);
            } catch (err) {
                console.error("Error fetching history", err);
                toast.error("Failed to load transaction history");
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [userId]);

    if (!userId && !loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-slate-50 px-5 text-center">
                <h2 className="text-xl font-black text-slate-800">Please Sign In</h2>
            </div>
        );
    }

    if (loading) {
        return <div className="flex-1 flex items-center justify-center min-h-screen bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>;
    }

    return (
        <div className="flex-1 flex flex-col min-h-screen bg-slate-50 relative pb-24">
            <TopBar />

            <main className="flex-1 px-5 pt-[80px] space-y-6">
                <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => router.back()} className="p-2 bg-white border border-slate-200 rounded-xl active:scale-95 transition-all text-slate-500 shadow-sm">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-slate-800 leading-tight flex items-center gap-2" style={{ fontFamily: "Outfit, sans-serif" }}>
                            Transaction History
                        </h1>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Completed & Cancelled Rentals</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {history.length === 0 ? (
                        <div className="text-center py-16">
                            <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 font-semibold text-sm">No transaction history found.</p>
                        </div>
                    ) : (
                        history.map((item) => {
                            const isOwner = item.ownerId === userId;
                            const isCompleted = item.status === "completed";

                            return (
                                <div
                                    key={item.id}
                                    onClick={() => router.push(`/rentals/${item.id}`)}
                                    className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-white shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer flex flex-col gap-3"
                                >
                                    <div className="flex gap-4">
                                        <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center shadow-inner">
                                            {item.photoUrl ? (
                                                <img src={item.photoUrl} alt={item.itemName} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-2xl">{item.icon || "📦"}</span>
                                            )}
                                        </div>
                                        <div className="flex-1 flex flex-col justify-center">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="text-[15px] font-black text-slate-800 leading-tight mb-0.5">{item.itemName}</h3>
                                                    <div className="flex items-center gap-1.5 opacity-80 mt-1">
                                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${isOwner ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
                                                            {isOwner ? "Listed" : "Borrowed"}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-0.5 text-slate-600 font-black">
                                                    <IndianRupee className="w-3.5 h-3.5" />
                                                    <span>{item.pricePerHour}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                                        <span className={`flex items-center gap-1 text-[11px] uppercase font-black tracking-widest ${isCompleted ? "text-emerald-500" : "text-rose-500"}`}>
                                            {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                            {item.status}
                                        </span>
                                        <span className="text-xs font-semibold text-slate-400">
                                            {item.createdAt ? new Date((item.createdAt as any).seconds * 1000).toLocaleDateString() : "Date Unknown"}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </main>
        </div>
    );
}
