"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Trophy, Star, Zap, ShieldCheck, Medal, Award, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useCollege } from "@/contexts/CollegeContext";

interface LeaderUser {
    id: string;
    name?: string;
    rollNumber?: string;
    department?: string;
    overallRating?: number;
    reviewCount?: number;
    completedRentals?: number;
    strikeCount?: number;
}

const BADGE_CONFIG = [
    { minRentals: 20, label: "🏆 Campus Legend", color: "bg-amber-100 text-amber-800 border-amber-200" },
    { minRentals: 10, label: "⭐ Lab Master", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
    { minRentals: 5,  label: "🌟 Trusted Lender", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    { minRentals: 1,  label: "✨ New Lender", color: "bg-slate-100 text-slate-600 border-slate-200" },
];

function getBadge(rentals: number) {
    return BADGE_CONFIG.find(b => rentals >= b.minRentals) ?? BADGE_CONFIG[BADGE_CONFIG.length - 1];
}

const RANK_ICONS = [
    <Trophy className="w-5 h-5 text-amber-500" />,
    <Medal className="w-5 h-5 text-slate-500" />,
    <Award className="w-5 h-5 text-amber-700" />,
];

export default function LeaderboardPage() {
    const router = useRouter();
    const { selectedCollege } = useCollege();
    const [users, setUsers] = useState<LeaderUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!db) { setLoading(false); return; }
        // Fetch top-rated verified users
        const fetchLeaders = async () => {
            try {
                const q = query(
                    collection(db as any, "users"),
                    orderBy("overallRating", "desc"),
                    limit(20)
                );
                const snap = await getDocs(q);
                const list: LeaderUser[] = snap.docs
                    .map(d => ({ id: d.id, ...d.data() } as LeaderUser))
                    .filter(u => (u.reviewCount ?? 0) > 0 || (u.completedRentals ?? 0) > 0);
                setUsers(list);
            } catch (e) {
                console.error("Leaderboard fetch failed:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaders();
    }, []);

    return (
        <div className="flex-1 flex flex-col min-h-screen bg-slate-50 pb-28">
            <TopBar />
            <main className="px-5 pt-[85px] animate-page-enter">

                {/* Hero */}
                <div className="relative bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl p-6 mb-6 overflow-hidden shadow-indigo">
                    <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -translate-x-8 -translate-y-8" />
                    <div className="absolute bottom-0 left-0 w-28 h-28 rounded-full bg-white/5 translate-x-4 translate-y-4" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <Trophy className="w-6 h-6 text-amber-300" />
                            <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Hall of Fame</span>
                        </div>
                        <h1 className="text-2xl font-black text-white leading-none mb-1" style={{ fontFamily: "Outfit, sans-serif" }}>
                            Campus Trust<br />Leaderboard
                        </h1>
                        <p className="text-indigo-200 text-xs font-semibold">
                            Top lenders in {selectedCollege?.name || "your campus"}
                        </p>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-4">
                    {BADGE_CONFIG.map(b => (
                        <div key={b.label} className={`shrink-0 px-3 py-1.5 rounded-full border text-[10px] font-black ${b.color}`}>
                            {b.label}
                        </div>
                    ))}
                </div>

                {/* List */}
                {loading ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-center py-16">
                        <Trophy className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                        <p className="text-slate-500 font-bold">No rankings yet.</p>
                        <p className="text-slate-400 text-sm mt-1">Be the first to lend and build trust!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {users.map((user, i) => {
                            const badge = getBadge(user.completedRentals ?? 0);
                            const stars = Math.round(user.overallRating ?? 0);
                            return (
                                <motion.div
                                    key={user.id}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05, type: "spring", stiffness: 400, damping: 35 }}
                                    className={`bg-white rounded-2xl border p-4 flex items-center gap-4 shadow-sm ${i === 0 ? "border-amber-200 ring-1 ring-amber-100" : "border-slate-100"}`}
                                >
                                    {/* Rank */}
                                    <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 shadow-inner">
                                        {i < 3 ? RANK_ICONS[i] : <span className="text-sm font-black text-slate-400">#{i + 1}</span>}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 overflow-hidden">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h3 className="font-black text-slate-800 text-sm truncate">{user.name || "Anonymous"}</h3>
                                            {user.strikeCount === 0 && (
                                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-slate-400 font-bold truncate">{user.department || user.rollNumber}</span>
                                        </div>
                                        <div className={`inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full border text-[9px] font-black ${badge.color}`}>
                                            {badge.label}
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: 5 }, (_, si) => (
                                                <Star
                                                    key={si}
                                                    className={`w-3 h-3 ${si < stars ? "text-amber-400 fill-amber-400" : "text-slate-200"}`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400">
                                            {user.reviewCount ?? 0} reviews
                                        </span>
                                        <div className="flex items-center gap-1 text-[10px] font-black text-indigo-600">
                                            <Zap className="w-3 h-3" />
                                            {user.completedRentals ?? 0} lent
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </main>
            <BottomNav />
        </div>
    );
}
