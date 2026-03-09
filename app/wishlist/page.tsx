"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { useCollege } from "@/contexts/CollegeContext";
import { Listing } from "@/lib/types";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Loader2, Bookmark, BookmarkX } from "lucide-react";
import { toast } from "sonner";

export default function WishlistPage() {
    const router = useRouter();
    const [items, setItems] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const userId = auth?.currentUser?.uid;

    useEffect(() => {
        if (!userId || !db) { setLoading(false); return; }

        const savedRef = collection(db as any, `users/${userId}/saved`);
        const unsub = onSnapshot(savedRef, async (snap) => {
            const ids = snap.docs.map(d => d.id);
            if (ids.length === 0) { setItems([]); setLoading(false); return; }

            const fetches = ids.map(id =>
                getDocs(query(collection(db as any, "rentals"), where("__name__", "==", id)))
            );
            const snaps = await Promise.all(fetches);
            const listings: Listing[] = [];
            snaps.forEach(s => s.forEach(d => listings.push({ id: d.id, ...d.data() } as Listing)));
            setItems(listings);
            setLoading(false);
        });

        return () => unsub();
    }, [userId]);

    const handleRemove = async (itemId: string) => {
        if (!userId || !db) return;
        await deleteDoc(doc(db as any, `users/${userId}/saved`, itemId));
        toast.success("Removed from wishlist");
    };

    if (!userId && !loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-slate-50 px-5 text-center">
                <Bookmark className="w-16 h-16 text-indigo-200 mb-4" />
                <h2 className="text-xl font-black text-slate-800">Sign In to View Wishlist</h2>
                <button onClick={() => router.push("/login")} className="mt-6 px-8 py-3 gradient-indigo text-white font-black rounded-2xl shadow-indigo">Sign In</button>
            </div>
        );
    }

    if (loading) return <div className="flex-1 flex items-center justify-center min-h-screen bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-indigo-400" /></div>;

    return (
        <div className="flex-1 flex flex-col min-h-screen bg-slate-50 pb-24">
            <TopBar />
            <main className="px-5 pt-[80px] space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <Bookmark className="w-5 h-5 text-indigo-500 fill-indigo-100" />
                    <h1 className="text-xl font-black text-slate-800" style={{ fontFamily: "Outfit, sans-serif" }}>My Wishlist</h1>
                    <span className="ml-auto text-xs font-bold text-slate-400">{items.length} saved</span>
                </div>

                {items.length === 0 ? (
                    <div className="text-center py-16">
                        <Bookmark className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-bold text-sm">No items saved yet.</p>
                        <p className="text-slate-400 text-xs mt-1">Tap the bookmark icon on any listing to save it here.</p>
                    </div>
                ) : (
                    items.map(item => (
                        <div
                            key={item.id}
                            className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-white shadow-sm flex gap-4 group"
                        >
                            <div
                                onClick={() => router.push(`/rentals/${item.id}`)}
                                className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-slate-100 cursor-pointer"
                            >
                                {item.photoUrl ? (
                                    <img src={item.photoUrl} alt={item.itemName} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-2xl">{item.icon}</div>
                                )}
                            </div>
                            <div className="flex-1 flex flex-col justify-center cursor-pointer" onClick={() => router.push(`/rentals/${item.id}`)}>
                                <h3 className="text-[15px] font-black text-slate-800 leading-tight">{item.itemName}</h3>
                                <p className="text-sm font-bold text-indigo-600 mt-1">₹{item.pricePerHour}/hr</p>
                                <span className={`text-[10px] uppercase font-black tracking-widest mt-1 ${item.status === "available" ? "text-emerald-500" : "text-amber-500"}`}>
                                    {item.status}
                                </span>
                            </div>
                            <button
                                onClick={() => handleRemove(item.id)}
                                className="p-2 text-rose-400 hover:text-rose-600 shrink-0 self-start transition-colors"
                            >
                                <BookmarkX className="w-5 h-5" />
                            </button>
                        </div>
                    ))
                )}
            </main>
            <BottomNav />
        </div>
    );
}
