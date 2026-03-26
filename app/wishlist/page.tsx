"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { collection, getDocs, getDoc, doc, deleteDoc, onSnapshot } from "firebase/firestore";
import { Listing } from "@/lib/types";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Loader2, Bookmark, BookmarkX, IndianRupee, MapPin, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { onAuthStateChanged } from "firebase/auth";

export default function WishlistPage() {
    const router = useRouter();
    const [items, setItems] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [authReady, setAuthReady] = useState(false);

    // Auth
    useEffect(() => {
        if (!auth) { setAuthReady(true); return; }
        const unsub = onAuthStateChanged(auth, (user) => {
            setUserId(user?.uid ?? null);
            setAuthReady(true);
        });
        return () => unsub();
    }, []);

    // Fetch saved items
    useEffect(() => {
        if (!authReady) return;
        if (!userId || !db) { setLoading(false); return; }

        const savedRef = collection(db as any, `users/${userId}/saved`);
        const unsub = onSnapshot(savedRef, async (snap) => {
            const ids = snap.docs.map(d => d.id);
            if (ids.length === 0) { setItems([]); setLoading(false); return; }

            const fetches = ids.map(id =>
                getDoc(doc(db as any, "rentals", id))
            );
            const docs = await Promise.all(fetches);
            const listings: Listing[] = docs
                .filter(d => d.exists())
                .map(d => ({ id: d.id, ...d.data() } as Listing));
            setItems(listings);
            setLoading(false);
        });

        return () => unsub();
    }, [userId, authReady]);

    const handleRemove = async (itemId: string) => {
        if (!userId || !db) return;
        await deleteDoc(doc(db as any, `users/${userId}/saved`, itemId));
        toast.success("Removed from wishlist");
    };

    if (!authReady || loading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-screen bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            </div>
        );
    }

    if (!userId) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-slate-50 px-5 text-center animate-page-enter">
                <div className="w-24 h-24 bg-indigo-50 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
                    <Bookmark className="w-10 h-10 text-indigo-300" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>Your Wishlist</h2>
                <p className="text-slate-500 text-sm font-medium mb-8 max-w-[260px]">Sign in to save items and access them anytime.</p>
                <button
                    onClick={() => router.push("/login")}
                    className="px-8 py-3.5 gradient-indigo text-white font-black rounded-2xl shadow-indigo animate-pulse-glow"
                >
                    Sign In
                </button>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col min-h-screen bg-slate-50 pb-28">
            <TopBar />
            <main className="px-5 pt-[80px] animate-page-enter">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center">
                        <Bookmark className="w-5 h-5 text-indigo-500 fill-indigo-100" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-800 leading-none" style={{ fontFamily: "Outfit, sans-serif" }}>My Wishlist</h1>
                        <p className="text-xs font-bold text-slate-400 mt-0.5">{items.length} item{items.length !== 1 ? "s" : ""} saved</p>
                    </div>
                </div>

                {items.length === 0 ? (
                    <div className="text-center py-20 animate-page-enter">
                        <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                            <Bookmark className="w-9 h-9 text-slate-300" />
                        </div>
                        <p className="text-slate-600 font-bold text-base">Nothing saved yet</p>
                        <p className="text-slate-400 text-sm mt-1 mb-6">Tap the bookmark icon on any listing to save it here.</p>
                        <button
                            onClick={() => router.push("/rentals")}
                            className="px-6 py-3 gradient-indigo text-white font-black rounded-2xl shadow-indigo text-sm"
                        >
                            Browse Items
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {items.map((item, i) => (
                            <div
                                key={item.id}
                                className="stagger-item bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex group"
                                style={{ animationDelay: `${i * 60}ms` }}
                            >
                                {/* Image */}
                                <div
                                    onClick={() => router.push(`/rentals/${item.id}`)}
                                    className="w-20 h-20 shrink-0 bg-slate-50 flex items-center justify-center cursor-pointer overflow-hidden"
                                >
                                    {item.photoUrl ? (
                                        <img
                                            src={item.photoUrl}
                                            alt={item.itemName}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                        />
                                    ) : (
                                        <span className="text-3xl">{item.icon || "📦"}</span>
                                    )}
                                </div>

                                {/* Details */}
                                <div
                                    className="flex-1 px-4 py-3 flex flex-col justify-center cursor-pointer"
                                    onClick={() => router.push(`/rentals/${item.id}`)}
                                >
                                    <h3 className="text-[15px] font-black text-slate-800 leading-tight">{item.itemName}</h3>
                                    <div className="flex items-center gap-3 mt-1">
                                        <div className="flex items-center gap-0.5 text-indigo-600 font-black text-sm">
                                            <IndianRupee className="w-3 h-3" />
                                            {item.pricePerHour}<span className="text-[10px] text-slate-400 font-bold ml-0.5"> per hour</span>
                                        </div>
                                        {item.block && (
                                            <div className="flex items-center gap-0.5 text-[10px] font-bold text-slate-400">
                                                <MapPin className="w-3 h-3" />
                                                {item.block}
                                            </div>
                                        )}
                                    </div>
                                    <span className={`text-[9px] uppercase font-black tracking-widest mt-1.5 ${item.status === "available" ? "text-emerald-500" : "text-amber-500"}`}>
                                        {item.status}
                                    </span>
                                </div>

                                {/* Remove */}
                                <button
                                    onClick={() => handleRemove(item.id)}
                                    className="px-4 flex items-center text-slate-300 hover:text-rose-400 transition-colors shrink-0"
                                >
                                    <BookmarkX className="w-5 h-5" />
                                </button>
                            </div>
                        ))}

                        {/* Quick discover */}
                        <div
                            onClick={() => router.push("/rentals")}
                            className="mt-6 p-4 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 flex items-center gap-3 cursor-pointer hover:bg-indigo-50 transition-colors"
                        >
                            <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />
                            <p className="text-sm font-bold text-indigo-500">Discover more items to save →</p>
                        </div>
                    </div>
                )}
            </main>
            <BottomNav />
        </div>
    );
}
