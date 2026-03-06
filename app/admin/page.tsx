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
            setBlockedUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as unknown as User)));
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
        <div className="flex-1 flex items-center justify-center min-h-screen bg-slate-50">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        </div>
    );

    const STATS = [
        { label: "Total Rentals", value: totalRentals, icon: Package, color: "bg-indigo-50 text-indigo-600 border border-indigo-100" },
        { label: "Reports Filed", value: reports.length, icon: AlertTriangle, color: "bg-amber-50 text-amber-600 border border-amber-100" },
        { label: "Users Blocked", value: blockedUsers.length, icon: UserX, color: "bg-rose-50 text-rose-600 border border-rose-100" },
        { label: "Status", value: "Live", icon: BarChart3, color: "bg-emerald-50 text-emerald-600 border border-emerald-100" },
    ];

    const REASON_COLOR: Record<string, string> = {
        "Item not returned": "bg-amber-50 text-amber-600 border border-amber-100",
        "Item damaged": "bg-rose-50 text-rose-600 border border-rose-100",
        "No-show": "bg-amber-50 text-amber-600 border border-amber-100",
        "Fraud": "bg-rose-50 text-rose-600 border border-rose-100",
        "Other": "bg-indigo-50 text-indigo-600 border border-indigo-100",
    };

    return (
        <div className="flex-1 flex flex-col min-h-screen bg-slate-50 relative overflow-y-auto pb-16">
            {/* Ambient Background Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-200/40 blob rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{ animationDelay: "0s" }} />
            <div className="absolute top-[20%] right-[-10%] w-[40%] h-[60%] bg-pink-200/30 blob rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{ animationDelay: "2s" }} />

            <div className="relative z-10 w-full max-w-md mx-auto">
                {/* Header */}
                <div className="px-6 pt-12 pb-6 bg-gradient-to-b from-indigo-50/80 to-transparent sticky top-0 backdrop-blur-md z-20 border-b border-indigo-100/50">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 bg-indigo-100/50 rounded-lg border border-indigo-200/50">
                            <Lock className="w-4 h-4 text-indigo-600" />
                        </div>
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-white/60 px-2 py-0.5 rounded-full shadow-sm border border-indigo-50">Admin Panel</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-800 leading-none" style={{ fontFamily: "Outfit, sans-serif" }}>
                        Trust &amp; Safety
                    </h1>
                    <p className="text-slate-500 font-semibold text-sm mt-2">Campus governance dashboard</p>

                    {!isAdmin && (
                        <div className="mt-5 bg-amber-50/80 border border-amber-200/50 rounded-2xl px-5 py-3.5 text-xs font-bold text-amber-700 shadow-sm backdrop-blur-sm flex items-center gap-3">
                            <span className="text-lg">⚠️</span> View-only mode. Contact admin for write access.
                        </div>
                    )}
                </div>

                <div className="px-5 space-y-8 mt-4">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {STATS.map((stat) => (
                            <div key={stat.label} className="bg-white/70 backdrop-blur-xl rounded-[2rem] border border-white p-5 space-y-3 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                    <div className={`p-2 rounded-xl shadow-inner ${stat.color}`}>
                                        <stat.icon className="w-4 h-4" />
                                    </div>
                                </div>
                                <p className="text-3xl font-black text-slate-800">{stat.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Reports Section */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 pl-2">
                            <ShieldAlert className="w-5 h-5 text-amber-500" />
                            <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest">Recent Reports</h2>
                        </div>
                        {reports.length === 0 ? (
                            <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white p-10 text-center shadow-sm">
                                <div className="bg-emerald-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-inner">
                                    <ShieldAlert className="w-8 h-8 text-emerald-500" />
                                </div>
                                <p className="text-slate-500 text-sm font-bold">No reports filed yet 🎉</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {reports.map(report => (
                                    <div key={report.id} className="bg-white/70 backdrop-blur-xl rounded-[1.5rem] border border-white p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
                                        <div className="space-y-1.5">
                                            <p className="font-black text-slate-800 text-sm">{report.reason}</p>
                                            <p className="text-[11px] font-semibold text-slate-500">
                                                {report.notes ? `"${report.notes.slice(0, 60)}..."` : "No additional notes"}
                                            </p>
                                        </div>
                                        <span className={`text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl shadow-inner ${REASON_COLOR[report.reason] || "bg-indigo-50 text-indigo-600 border border-indigo-100"}`}>
                                            {report.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Blocked Users */}
                    <section className="space-y-4 pb-8">
                        <div className="flex items-center gap-2 pl-2">
                            <UserX className="w-5 h-5 text-rose-500" />
                            <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest">Blocked Users</h2>
                        </div>
                        {blockedUsers.length === 0 ? (
                            <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white p-10 text-center shadow-sm">
                                <div className="bg-emerald-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-inner">
                                    <Users className="w-8 h-8 text-emerald-500" />
                                </div>
                                <p className="text-slate-500 text-sm font-bold">Campus is clean 🌱</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {blockedUsers.map(user => (
                                    <div key={user.uid} className="bg-white/70 backdrop-blur-xl rounded-[1.5rem] border border-rose-50 p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                                <UserX className="w-6 h-6 text-rose-500" />
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-800 text-base">{user.rollNumber}</p>
                                                <p className="text-[11px] font-bold text-slate-500 mt-0.5">{user.phoneNumber}</p>
                                                <div className="bg-rose-50 border border-rose-100 text-rose-600 px-2 py-0.5 rounded-lg mt-1.5 inline-flex items-center gap-1 shadow-inner">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">{user.strikeCount} strikes</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleUnblock(user.uid)}
                                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-emerald-100 text-emerald-600 text-[11px] font-black uppercase tracking-widest active:scale-95 transition-all hover:bg-emerald-50 hover:border-emerald-200 shadow-sm"
                                        >
                                            <UserCheck className="w-4 h-4" />
                                            <span>Unblock</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}
