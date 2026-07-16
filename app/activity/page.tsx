"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, onSnapshot, Timestamp } from "firebase/firestore";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Package, CheckCircle2, Tag, MessageSquare, Clock, RefreshCw, Loader2 } from "lucide-react";
import { useCollege } from "@/contexts/CollegeContext";
import Link from "next/link";

interface ActivityItem {
    id: string;
    type: "listed" | "borrowed" | "returned" | "completed";
    itemName: string;
    ownerName?: string;
    renterName?: string;
    college?: string;
    collegeId?: string;
    createdAt: Timestamp | Date;
    rentalId?: string;
    icon?: string;
}

const EVENT_CONFIG = {
    listed: { label: "just listed", icon: Tag, color: "bg-blue-50 text-blue-600 border-blue-100", dot: "bg-blue-500" },
    borrowed: { label: "is borrowing", icon: Package, color: "bg-amber-50 text-amber-600 border-amber-100", dot: "bg-amber-500" },
    returned: { label: "returned", icon: RefreshCw, color: "bg-emerald-50 text-emerald-600 border-emerald-100", dot: "bg-emerald-500" },
    completed: { label: "completed rental for", icon: CheckCircle2, color: "bg-blue-50 text-blue-600 border-blue-100", dot: "bg-blue-500" },
};

function timeAgo(ts: Timestamp | Date): string {
    const date = ts instanceof Date ? ts : ts.toDate?.() ?? new Date();
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return `${Math.floor(diffHrs / 24)}d ago`;
}

export default function ActivityFeedPage() {
    const { selectedCollege } = useCollege();
    const [events, setEvents] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!db) { setLoading(false); return; }

        // Real-time listener on recent rentals sorted by createAt desc
        const q = query(
            collection(db as any, "rentals"),
            orderBy("createdAt", "desc"),
            limit(30)
        );

        const unsub = onSnapshot(q, (snap) => {
            const items: ActivityItem[] = snap.docs
                .filter(d => {
                    // Filter to selected college if available
                    if (!selectedCollege) return true;
                    const data = d.data();
                    return data.collegeId === selectedCollege.id || data.college === selectedCollege.name;
                })
                .map(d => {
                    const data = d.data();
                    return {
                        id: d.id,
                        type: data.status === "active" ? "borrowed"
                            : data.status === "completed" ? "completed"
                                : data.status === "requested" ? "borrowed"
                                    : "listed",
                        itemName: data.itemName || "an item",
                        ownerName: data.ownerName || "Someone",
                        icon: data.icon || "📦",
                        college: data.college,
                        collegeId: data.collegeId,
                        createdAt: data.createdAt,
                        rentalId: d.id,
                    } as ActivityItem;
                });
            setEvents(items);
            setLoading(false);
        });

        return () => unsub();
    }, [selectedCollege]);

    return (
        <div className="flex-1 flex flex-col min-h-screen bg-slate-50 pb-28">
            <TopBar />
            <main className="px-4 pt-[85px] animate-page-enter">

                {/* Header */}
                <div className="mb-5">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Live</span>
                    </div>
                    <h1 className="text-2xl font-black text-slate-800 leading-none" style={{ fontFamily: "Outfit, sans-serif" }}>
                        Campus Activity
                    </h1>
                    <p className="text-slate-400 text-xs font-medium mt-1">
                        What's happening in {selectedCollege?.name || "your campus"} right now
                    </p>
                </div>

                {/* Feed */}
                {loading ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="w-7 h-7 animate-spin text-blue-400" />
                    </div>
                ) : events.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm">
                        <Zap className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                        <p className="font-bold text-slate-400">No activity yet</p>
                        <p className="text-xs text-slate-300 mt-1">Be the first to list an item!</p>
                    </div>
                ) : (
                    <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-slate-100" />

                        <AnimatePresence>
                            {events.map((event, i) => {
                                const config = EVENT_CONFIG[event.type] || EVENT_CONFIG.listed;
                                const Icon = config.icon;
                                return (
                                    <motion.div
                                        key={event.id}
                                        initial={{ opacity: 0, x: -16 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.04, type: "spring", stiffness: 400, damping: 35 }}
                                        className="flex gap-3 mb-4 relative"
                                    >
                                        {/* Dot */}
                                        <div className={`w-10 h-10 rounded-full border-2 border-white shadow flex items-center justify-center shrink-0 z-10 ${config.color}`}>
                                            <span className="text-base">{event.icon}</span>
                                        </div>

                                        {/* Card */}
                                        <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1">
                                                    <p className="text-xs font-black text-slate-700 leading-snug">
                                                        {event.ownerName}{" "}
                                                        <span className={`font-bold text-[11px] px-1.5 py-0.5 rounded-full border ${config.color}`}>
                                                            {config.label}
                                                        </span>{" "}
                                                        <span className="text-blue-600">{event.itemName}</span>
                                                    </p>
                                                    <div className="flex items-center gap-1.5 mt-1.5">
                                                        <Clock className="w-3 h-3 text-slate-300" />
                                                        <span className="text-[10px] text-slate-400 font-bold">
                                                            {timeAgo(event.createdAt)}
                                                        </span>
                                                    </div>
                                                </div>
                                                {event.rentalId && (
                                                    <Link
                                                        href={`/rentals/${event.rentalId}`}
                                                        className="shrink-0 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-wider hover:border-blue-200 hover:text-blue-600 transition-colors active:scale-95"
                                                    >
                                                        View
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </main>
            <BottomNav />
        </div>
    );
}
