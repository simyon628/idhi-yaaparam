"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
export const dynamic = "force-dynamic";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { TopBar } from "@/components/layout/TopBar";
import { RentalCard } from "@/components/rental/RentalCard";
import { BottomNav } from "@/components/layout/BottomNav";
import { Listing } from "@/lib/types";
import { Loader2, PackageSearch, AlertTriangle, Heart, Plus } from "lucide-react";
import { useCollege } from "@/contexts/CollegeContext";
import { DEPARTMENTS, BLOCKS } from "@/lib/constants";

export default function HomePage() {
    const [rentals, setRentals] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDept, setSelectedDept] = useState<string>("All");
    const [selectedBlock, setSelectedBlock] = useState<string>("All");

    const router = useRouter();
    const { selectedCollege, isReady } = useCollege();

    // Live Firestore feed
    useEffect(() => {
        if (!db || !isReady) return;

        if (!selectedCollege) {
            setRentals([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const q = query(
            collection(db, "rentals"),
            where("status", "==", "available"),
            where("college", "==", selectedCollege),
            orderBy("createdAt", "desc")
        );
        const unsub = onSnapshot(q, (snap) => {
            setRentals(snap.docs.map(d => ({ id: d.id, ...d.data() } as Listing)));
            setLoading(false);
        });
        return () => unsub();
    }, [selectedCollege, isReady]);

    const filteredRentals = rentals.filter(r => {
        const matchDept = selectedDept === "All" || r.department === selectedDept;
        const matchBlock = selectedBlock === "All" || r.block === selectedBlock;
        return matchDept && matchBlock;
    });

    const requireAuth = (callbackUrl: string) => {
        if (!auth?.currentUser) {
            router.push(`/login?redirect=${encodeURIComponent(callbackUrl)}`);
        } else {
            router.push(callbackUrl);
        }
    };

    if (!isReady) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col pb-32 min-h-screen">
            <TopBar />

            {/* Floating FAB for "Rent your item" (Mobile First) */}
            <button
                onClick={() => requireAuth("/rentals/new")}
                className="fixed bottom-24 right-5 z-40 bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-white p-4 rounded-2xl shadow-indigo transition-all flex items-center justify-center"
            >
                <Plus className="w-6 h-6" />
            </button>

            <div className="mt-24 px-5 space-y-10">

                {/* 1. Rent Items Section */}
                <section className="space-y-5">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-2xl font-black text-white leading-none" style={{ fontFamily: "Outfit, sans-serif" }}>
                            Rent items in your college
                        </h2>
                        {selectedCollege ? (
                            <p className="text-sm font-medium text-slate-400">Showing available items for {selectedCollege}</p>
                        ) : (
                            <p className="text-sm font-medium text-amber-400">Please select a campus from the top bar.</p>
                        )}
                    </div>

                    {/* Filters */}
                    {selectedCollege && (
                        <div className="flex flex-col gap-3">
                            {/* Department Filter (Scrollable) */}
                            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                                <button
                                    onClick={() => setSelectedDept("All")}
                                    className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${selectedDept === "All" ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/50" : "bg-slate-800/50 text-slate-400 border-slate-700 hover:text-white"}`}
                                >
                                    All Depts
                                </button>
                                {DEPARTMENTS.map(dept => (
                                    <button
                                        key={dept}
                                        onClick={() => setSelectedDept(dept)}
                                        className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${selectedDept === dept ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/50" : "bg-slate-800/50 text-slate-400 border-slate-700 hover:text-white"}`}
                                    >
                                        {dept}
                                    </button>
                                ))}
                            </div>

                            {/* Block Filter (Scrollable) */}
                            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                                <button
                                    onClick={() => setSelectedBlock("All")}
                                    className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${selectedBlock === "All" ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/50" : "bg-slate-800/50 text-slate-400 border-slate-700 hover:text-white"}`}
                                >
                                    All Blocks
                                </button>
                                {BLOCKS.map(block => (
                                    <button
                                        key={block}
                                        onClick={() => setSelectedBlock(block)}
                                        className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${selectedBlock === block ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/50" : "bg-slate-800/50 text-slate-400 border-slate-700 hover:text-white"}`}
                                    >
                                        {block}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Grid */}
                    {!selectedCollege ? (
                        <div className="glass rounded-2xl p-8 flex flex-col items-center gap-4 border border-slate-700/50 text-center">
                            <span className="text-4xl text-slate-500">🎓</span>
                            <p className="text-slate-400 font-medium">Select your college above to browse inventory.</p>
                        </div>
                    ) : loading ? (
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="rounded-2xl overflow-hidden glass p-2 border border-slate-800 flex flex-col pt-3">
                                    <div className="aspect-square skeleton rounded-xl mb-3 mt-1 mx-2" />
                                    <div className="skeleton h-3 rounded-md mb-2 w-3/4 mx-2" />
                                    <div className="skeleton h-2 rounded-md w-1/2 mx-2 mb-2" />
                                </div>
                            ))}
                        </div>
                    ) : filteredRentals.length === 0 ? (
                        <div className="glass rounded-2xl p-10 flex flex-col items-center gap-4 border border-slate-700 border-dashed">
                            <PackageSearch className="w-10 h-10 text-slate-600" />
                            <div className="text-center">
                                <p className="font-bold text-slate-300">Nothing available here</p>
                                <p className="text-sm text-slate-500 mt-1">Try adjusting your filters or be the first to list an item.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            {filteredRentals.map((rental) => (
                                <RentalCard key={rental.id} item={rental} />
                            ))}
                        </div>
                    )}
                </section>

                {/* 2. Write a Report Section */}
                <section className="glass rounded-2xl p-6 border border-rose-500/20 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent z-0 pointer-events-none" />
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-rose-400" />
                                <h2 className="text-xl font-black text-white" style={{ fontFamily: "Outfit, sans-serif" }}>Report an issue</h2>
                            </div>
                            <p className="text-xs font-medium text-slate-400 max-w-[250px]">
                                Had a problem with a rental or user? Report it here to keep our campus safe.
                            </p>
                        </div>
                        <button
                            onClick={() => requireAuth("/reports/new")}
                            className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 px-5 py-3 rounded-xl text-sm font-bold transition-colors w-fit shadow-lg shadow-rose-500/10"
                        >
                            Write a report
                        </button>
                    </div>
                </section>

                {/* 3. Fundraising Placeholder */}
                <section className="glass rounded-2xl p-6 border border-emerald-500/20 relative overflow-hidden">
                    <div className="absolute -inset-10 bg-gradient-to-br from-emerald-500/5 to-transparent z-0 pointer-events-none blur-2xl" />
                    <div className="flex flex-col items-center text-center gap-3 relative z-10">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
                            <Heart className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-white" style={{ fontFamily: "Outfit, sans-serif" }}>Campus fundraising</h2>
                            <span className="inline-block mt-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">Coming Soon</span>
                        </div>
                        <p className="text-xs font-medium text-slate-400 max-w-[280px]">
                            Soon you'll be able to support clubs and projects directly inside Idhi Yaaparam.
                        </p>
                        <button className="mt-2 text-xs font-bold text-slate-300 border border-slate-700 hover:bg-slate-800 px-4 py-2 rounded-lg transition-colors">
                            Notify me when it's live
                        </button>
                    </div>
                </section>

                {/* Bottom spacer for FAB/Nav */}
                <div className="h-4" />
            </div>

            <BottomNav />
        </div>
    );
}
