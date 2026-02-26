"use client";

import { useState, useEffect } from "react";
export const dynamic = "force-dynamic";
import { db, auth } from "@/lib/firebase";
import {
    collection, query, onSnapshot, doc, updateDoc,
    where, orderBy
} from "firebase/firestore";
import { toast } from "sonner";
import {
    ShieldAlert, UserX, UserCheck, Loader2,
    Package, AlertTriangle, BarChart3, Users, Lock
} from "lucide-react";
import { Report, User } from "@/lib/types";

export default function AdminPanel() {
    const [reports, setReports] = useState<Report[]>([]);
    const [blockedUsers, setBlockedUsers] = useState<User[]>([]);
    const [totalRentals, setTotalRentals] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        if (!db || !auth?.currentUser) return;

        // Check admin status
        const userId = auth.currentUser.uid;
        const unsub0 = onSnapshot(doc(db, "users", userId), (snap) => {
            if (snap.exists()) setIsAdmin(snap.data()?.isAdmin === true);
        });

        const qReports = query(collection(db, "reports"), orderBy("timestamp", "desc"));
        const unsub1 = onSnapshot(qReports, (snap) => {
            setReports(snap.docs.map(d => ({ id: d.id, ...d.data() } as Report)));
        });

        const qBlocked = query(collection(db, "users"), where("isBlocked", "==", true));
        const unsub2 = onSnapshot(qBlocked, (snap) => {
            setBlockedUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as User)));
            setLoading(false);
        });

        const qRentals = query(collection(db, "rentals"));
        const unsub3 = onSnapshot(qRentals, (snap) => setTotalRentals(snap.size));

        return () => { unsub0(); unsub1(); unsub2(); unsub3(); };
    }, []);

    const handleUnblock = async (userId: string) => {
        if (!db) return;
        try {
            await updateDoc(doc(db, "users", userId), { isBlocked: false, strikeCount: 0 });
            toast.success("User unblocked & strikes cleared.");
        } catch {
            toast.error("Failed to unblock user.");
        }
    };

    if (loading) return (
        <div className="flex-1 flex items-center justify-center min-h-screen">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
        </div>
    );

    const STATS = [
        { label: "Total Rentals", value: totalRentals, icon: Package, color: "badge-indigo" },
        { label: "Reports Filed", value: reports.length, icon: AlertTriangle, color: "badge-amber" },
        { label: "Users Blocked", value: blockedUsers.length, icon: UserX, color: "badge-rose" },
        { label: "Status", value: "Live", icon: BarChart3, color: "badge-trust" },
    ];

    const REASON_COLOR: Record<string, string> = {
        "Item not returned": "badge-amber",
        "Item damaged": "badge-rose",
        "No-show": "badge-amber",
        "Fraud": "badge-rose",
        "Other": "badge-indigo",
    };

    return (
        <div className="flex-1 flex flex-col min-h-screen pb-16">
            {/* Header */}
            <div className="px-5 pt-12 pb-6" style={{ background: "linear-gradient(180deg, hsl(239,84%,12%) 0%, transparent 100%)" }}>
                <div className="flex items-center gap-2 mb-2">
                    <Lock className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Admin Panel</span>
                </div>
                <h1 className="text-3xl font-black text-white leading-none" style={{ fontFamily: "Outfit, sans-serif" }}>
                    Trust &amp; Safety
                </h1>
                <p className="text-slate-500 text-sm mt-1">Campus governance dashboard</p>

                {!isAdmin && (
                    <div className="mt-4 bg-amber-500/10 border border-amber-500/25 rounded-xl px-4 py-3 text-sm badge-amber">
                        ⚠️ View-only mode. Contact admin for write access.
                    </div>
                )}
            </div>

            <div className="px-5 space-y-7">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    {STATS.map((stat) => (
                        <div key={stat.label} className="glass rounded-2xl border border-slate-700/50 p-4 space-y-2">
                            <div className="flex items-center justify-between">
                                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{stat.label}</p>
                                <div className={`p-1.5 rounded-lg ${stat.color}`}>
                                    <stat.icon className="w-3 h-3" />
                                </div>
                            </div>
                            <p className="text-2xl font-black text-white">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Reports Section */}
                <section className="space-y-3">
                    <div className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-amber-400" />
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Recent Reports</h2>
                    </div>
                    {reports.length === 0 ? (
                        <div className="glass rounded-2xl border border-slate-700/50 p-8 text-center">
                            <ShieldAlert className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                            <p className="text-slate-600 text-sm font-medium">No reports filed yet 🎉</p>
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {reports.map(report => (
                                <div key={report.id} className="glass rounded-xl border border-slate-700/50 p-4 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="font-bold text-white text-sm">{report.reason}</p>
                                        <p className="text-[10px] text-slate-600 font-medium">
                                            {report.notes ? `"${report.notes.slice(0, 60)}..."` : "No additional notes"}
                                        </p>
                                    </div>
                                    <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg ${REASON_COLOR[report.reason] || "badge-indigo"}`}>
                                        {report.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Blocked Users */}
                <section className="space-y-3 pb-8">
                    <div className="flex items-center gap-2">
                        <UserX className="w-4 h-4 text-rose-400" />
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Blocked Users</h2>
                    </div>
                    {blockedUsers.length === 0 ? (
                        <div className="glass rounded-2xl border border-slate-700/50 p-8 text-center">
                            <Users className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                            <p className="text-slate-600 text-sm font-medium">Campus is clean 🌱</p>
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {blockedUsers.map(user => (
                                <div key={user.uid} className="glass rounded-xl border border-rose-500/20 p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/25 flex items-center justify-center">
                                            <UserX className="w-5 h-5 text-rose-400" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-white text-sm">{user.rollNumber}</p>
                                            <p className="text-[10px] font-medium text-slate-600">{user.phoneNumber}</p>
                                            <p className="text-[9px] badge-rose px-1.5 py-0.5 rounded mt-0.5 inline-block">
                                                {user.strikeCount} strikes
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleUnblock(user.uid)}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass border border-emerald-500/25 text-emerald-400 text-xs font-bold active:scale-95 transition-all hover:bg-emerald-500/10"
                                    >
                                        <UserCheck className="w-3.5 h-3.5" />
                                        Unblock
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
