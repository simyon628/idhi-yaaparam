"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, where } from "firebase/firestore";
import { theme } from "@/lib/theme.config";
import { Users, ShoppingBag, AlertTriangle, TrendingUp, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useActiveBanners } from "@/lib/hooks/useActiveBanners";

export default function OwnerDashboard() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeRentals: 0,
        pendingReports: 0,
        newSignupsToday: 0
    });
    const { banners } = useActiveBanners();

    useEffect(() => {
        if (!db) return;

        // In a real production app at 100K users, these would use Cloud Functions for aggregation.
        // For now, simple onSnapshot works well up to ~10K users.
        
        const unsubs: (() => void)[] = [];

        // Users count
        unsubs.push(onSnapshot(collection(db, "users"), (snap) => {
            let today = 0;
            const now = new Date();
            snap.docs.forEach(d => {
                const data = d.data();
                if (data.createdAt) {
                    const date = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
                    if (date.toDateString() === now.toDateString()) today++;
                }
            });
            setStats(s => ({ ...s, totalUsers: snap.size, newSignupsToday: today }));
        }));

        // Active rentals count
        unsubs.push(onSnapshot(query(collection(db, "rentals"), where("status", "==", "available")), (snap) => {
            setStats(s => ({ ...s, activeRentals: snap.size }));
        }));

        // Pending reports
        unsubs.push(onSnapshot(query(collection(db, "reports"), where("status", "==", "pending")), (snap) => {
            setStats(s => ({ ...s, pendingReports: snap.size }));
        }));

        return () => unsubs.forEach(u => u());
    }, []);

    const STAT_CARDS = [
        { label: "Total Users", value: stats.totalUsers, icon: Users, color: "#3B82F6", bg: "#EFF6FF" },
        { label: "Active Items", value: stats.activeRentals, icon: ShoppingBag, color: "#10B981", bg: "#ECFDF5" },
        { label: "Today's Signups", value: stats.newSignupsToday, icon: TrendingUp, color: "#0B57D0", bg: "#F5F3FF" },
        { label: "Pending Reports", value: stats.pendingReports, icon: AlertTriangle, color: "#F59E0B", bg: "#FFFBEB" },
    ];

    return (
        <div className="space-y-6">
            {/* Quick Stats Grid */}
            <div>
                <h2 className="text-[13px] font-black uppercase tracking-widest text-slate-500 mb-3 ml-1">Platform Overview</h2>
                <div className="grid grid-cols-2 gap-3">
                    {STAT_CARDS.map((stat, i) => {
                        const Icon = stat.icon;
                        return (
                            <div key={i} className="bg-white p-4 rounded-[20px] shadow-sm border border-slate-100 flex flex-col gap-3">
                                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: stat.bg }}>
                                    <Icon style={{ width: 18, height: 18, color: stat.color }} />
                                </div>
                                <div>
                                    <div className="text-2xl font-black text-slate-800" style={{ fontFamily: "'Syne', sans-serif" }}>
                                        {stat.value.toLocaleString()}
                                    </div>
                                    <div className="text-[11px] font-bold text-slate-500">{stat.label}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-[13px] font-black uppercase tracking-widest text-slate-500 mb-3 ml-1">Quick Actions</h2>
                <div className="flex flex-col gap-3">
                    <Link href="/owner/banners" className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between no-underline">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: theme.brand.gradient }}>
                                <span className="text-white text-lg">🖼️</span>
                            </div>
                            <div>
                                <div className="text-sm font-bold text-slate-800">Manage Banners</div>
                                <div className="text-xs font-medium text-slate-500">{banners.length} active banners</div>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                    </Link>

                    <Link href="/owner/users" className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between no-underline">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
                                <span className="text-lg">🧑‍🎓</span>
                            </div>
                            <div>
                                <div className="text-sm font-bold text-slate-800">User Database</div>
                                <div className="text-xs font-medium text-slate-500">View College Hierarchy</div>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                    </Link>
                </div>
            </div>

            {/* Theme Config Info */}
            <div>
                <h2 className="text-[13px] font-black uppercase tracking-widest text-slate-500 mb-3 ml-1">Brand Theme</h2>
                <div className="bg-white p-5 rounded-[20px] shadow-sm border border-slate-100">
                    <div className="w-full h-16 rounded-xl mb-3 flex items-center justify-center text-white font-bold text-sm shadow-inner" style={{ background: theme.brand.gradient }}>
                        Current Header Gradient
                    </div>
                    <p className="text-xs font-medium text-slate-600 leading-relaxed">
                        The core brand colors and gradients are centralized in code. To rebrand the application (e.g., for a festival), ask your developer to modify <code className="bg-slate-100 px-1.5 py-0.5 rounded text-blue-600 font-bold">lib/theme.config.ts</code>.
                    </p>
                </div>
            </div>
        </div>
    );
}
