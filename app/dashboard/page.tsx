"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { Listing } from "@/lib/types";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { ChevronRight, Loader2, BarChart2, Package, Eye, IndianRupee, Star, TrendingUp } from "lucide-react";

export default function DashboardPage() {
    const router = useRouter();
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const userId = auth?.currentUser?.uid;

    useEffect(() => {
        if (!userId || !db) { setLoading(false); return; }
        const q = query(
            collection(db as any, "rentals"),
            where("ownerId", "==", userId)
        );
        getDocs(q).then(snap => {
            setListings(snap.docs.map(d => ({ id: d.id, ...d.data() } as Listing)));
            setLoading(false);
        });
    }, [userId]);

    const totalEarnings = listings
        .filter(l => l.status === "completed")
        .reduce((sum, l) => sum + (l.pricePerHour || 0), 0);

    const totalRequests = listings.filter(l => l.status !== "available").length;
    const activeRentals = listings.filter(l => l.status === "active").length;
    const availableListings = listings.filter(l => l.status === "available").length;

    if (!userId && !loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-slate-50 px-5 text-center">
                <h2 className="text-xl font-black text-slate-800">Sign In to View Dashboard</h2>
                <button onClick={() => router.push("/login")} className="mt-6 px-8 py-3 gradient-indigo text-white font-black rounded-2xl shadow-indigo">Sign In</button>
            </div>
        );
    }

    if (loading) return <div className="flex-1 flex items-center justify-center min-h-screen bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-indigo-400" /></div>;

    const STATS = [
        { label: "Total Listings", value: listings.length, icon: Package, color: "bg-indigo-50 text-indigo-600 border-indigo-100" },
        { label: "Active Now", value: activeRentals, icon: TrendingUp, color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
        { label: "Requests", value: totalRequests, icon: Eye, color: "bg-amber-50 text-amber-600 border-amber-100" },
        { label: "Completed", value: listings.filter(l => l.status === "completed").length, icon: Star, color: "bg-purple-50 text-purple-600 border-purple-100" },
    ];

    return (
        <div className="flex-1 flex flex-col min-h-screen bg-slate-50 pb-24">
            <TopBar />
            <main className="px-5 pt-[80px] space-y-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-800" style={{ fontFamily: "Outfit, sans-serif" }}>Owner Dashboard</h1>
                    <p className="text-sm font-semibold text-slate-500">Track your listings and earnings</p>
                </div>

                {/* Earnings Banner */}
                <div className="gradient-indigo rounded-[2rem] p-6 text-white shadow-indigo relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
                    <p className="text-[11px] font-black uppercase tracking-widest opacity-80">Estimated Earnings</p>
                    <p className="text-4xl font-black mt-1">₹{totalEarnings}</p>
                    <p className="text-xs opacity-70 mt-2 font-semibold">{listings.filter(l => l.status === "completed").length} completed rentals</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    {STATS.map(stat => (
                        <div key={stat.label} className={`bg-white rounded-[1.5rem] border p-4 shadow-sm space-y-2 ${stat.color.split(" ")[2]}`}>
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                                <div className={`p-1.5 rounded-lg border ${stat.color}`}>
                                    <stat.icon className="w-3.5 h-3.5" />
                                </div>
                            </div>
                            <p className="text-3xl font-black text-slate-800">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Listings Table */}
                <div className="space-y-3">
                    <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest">My Listings Performance</h2>
                    {listings.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 font-semibold text-sm">
                            <Package className="w-10 h-10 mx-auto mb-2 text-slate-200" />
                            No listings yet. Start by posting an item!
                        </div>
                    ) : (
                        listings.map(item => (
                            <div
                                key={item.id}
                                onClick={() => router.push(`/rentals/${item.id}`)}
                                className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-white shadow-sm flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-all hover:shadow-md"
                            >
                                <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                                    {item.photoUrl ? (
                                        <img src={item.photoUrl} alt={item.itemName} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xl">{item.icon}</div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-black text-slate-800 leading-tight">{item.itemName}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs font-bold text-indigo-600">₹{item.pricePerHour}/hr</span>
                                        <span className={`text-[9px] uppercase font-black tracking-widest px-2 py-0.5 rounded-md ${item.status === "available" ? "bg-emerald-50 text-emerald-600" : item.status === "active" ? "bg-indigo-50 text-indigo-600" : item.status === "requested" ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-500"}`}>
                                            {item.status}
                                        </span>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                            </div>
                        ))
                    )}
                </div>
            </main>
            <BottomNav />
        </div>
    );
}
