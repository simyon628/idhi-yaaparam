"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Loader2, AlertTriangle, Users, Clock, ShieldCheck } from "lucide-react";
import { Report, User } from "@/lib/types";

export default function GroupRentalsPage() {
    const router = useRouter();

    return (
        <div className="flex-1 flex flex-col min-h-screen bg-slate-50 pb-24">
            <TopBar />
            <main className="px-5 pt-[80px] space-y-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-800" style={{ fontFamily: "Outfit, sans-serif" }}>Group Rentals</h1>
                    <p className="text-sm font-semibold text-slate-500 mt-1">Share equipment with multiple students at once</p>
                </div>

                {/* Explainer Banner */}
                <div className="gradient-blue rounded-[2rem] p-6 text-white relative overflow-hidden shadow-blue">
                    <div className="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8" />
                    <Users className="w-10 h-10 mb-3 opacity-80" />
                    <h2 className="text-lg font-black mb-2">Perfect for Lab Kits!</h2>
                    <p className="text-sm font-semibold opacity-80 leading-relaxed">
                        One owner. Multiple borrowers. Share an Arduino kit, a project model, or a lab coat with your entire batch group.
                    </p>
                </div>

                <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm space-y-4">
                    <div className="flex items-center gap-3 text-slate-700">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                            <span className="font-black text-blue-600 text-sm">1</span>
                        </div>
                        <p className="text-sm font-bold">Owner posts the item as a Group Rental</p>
                    </div>
                    <div className="flex items-center gap-3 text-slate-700">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                            <span className="font-black text-blue-600 text-sm">2</span>
                        </div>
                        <p className="text-sm font-bold">Up to 5 students can each request it for different time slots</p>
                    </div>
                    <div className="flex items-center gap-3 text-slate-700">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                            <span className="font-black text-blue-600 text-sm">3</span>
                        </div>
                        <p className="text-sm font-bold">Each borrower returns directly to the next borrower in sequence</p>
                    </div>
                    <div className="flex items-center gap-3 text-slate-700">
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        </div>
                        <p className="text-sm font-bold text-emerald-700">Every participant is ID-verified and accountable</p>
                    </div>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex items-start gap-3">
                    <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-black text-amber-800">Coming Soon</p>
                        <p className="text-xs font-semibold text-amber-700 mt-1 leading-relaxed">
                            Group Rentals scheduling is being built. We're adding time-slot coordination, shared chat rooms, and chain accountability tracking.
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => router.push("/rentals/new")}
                    className="w-full h-14 rounded-2xl gradient-blue text-white font-black shadow-blue flex items-center justify-center gap-2"
                >
                    Post a Standard Rental Instead
                </button>
            </main>
            <BottomNav />
        </div>
    );
}
