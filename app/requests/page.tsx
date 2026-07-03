"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { useCollege } from "@/contexts/CollegeContext";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Loader2, Plus, ArrowRight, Clock, MapPin, Tag } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { CATEGORIES } from "@/components/ui/CategoryGrid";

export default function RequestsPage() {
    const router = useRouter();
    const { selectedCollege, isReady } = useCollege();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isReady || !selectedCollege || !db) return;

        const q = query(
            collection(db as any, "requests"),
            where("collegeId", "==", selectedCollege.id),
            where("status", "==", "open"),
            orderBy("createdAt", "desc")
        );

        const unsub = onSnapshot(q, (snap) => {
            setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });

        return () => unsub();
    }, [selectedCollege, isReady]);

    if (!isReady || !selectedCollege) return null;

    return (
        <div className="flex-1 flex flex-col min-h-screen bg-slate-50 pb-24">
            <TopBar />

            <main className="mt-[80px] px-5 py-4 space-y-6">
                <header className="animate-page-enter">
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Campus Needs</p>
                    <h1 className="text-3xl font-black text-slate-800 leading-tight" style={{ fontFamily: "Outfit, sans-serif" }}>Requests</h1>
                    <p className="text-xs font-bold text-slate-500 mt-1">Help fellow students and earn trust coins</p>
                </header>

                <div className="space-y-4">
                    {loading ? (
                        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-400" /></div>
                    ) : requests.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm px-6">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Tag className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-black text-slate-800">No active requests</h3>
                            <p className="text-sm font-bold text-slate-400 mt-1">Check back later or post your own demand!</p>
                        </div>
                    ) : (
                        requests.map((req) => (
                            <div 
                                key={req.id} 
                                className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm relative overflow-hidden group active:scale-[0.98] transition-all"
                                onClick={() => router.push(`/chat?withUser=${req.requesterId}&itemRequested=${req.id}`)}
                            >
                                {req.urgency === "Urgent" && (
                                    <div className="absolute top-0 right-0 bg-rose-500 text-white text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-lg">
                                        Urgent 🔥
                                    </div>
                                )}
                                
                                <div className="flex items-start gap-4 mb-4">
                                    <div 
                                        className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-slate-50"
                                        style={{ backgroundColor: "#f8fafc" }}
                                    >
                                        <span className="text-xl">
                                            {CATEGORIES.find(c => c.id === req.categoryId)?.icon || "📦"}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0 pr-6">
                                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">{req.categoryName}</p>
                                        <h3 className="text-[15px] font-bold text-slate-800 leading-tight truncate">{req.title}</h3>
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                                <MapPin className="w-3 h-3" /> {req.block}
                                            </div>
                                            <div className="w-1 h-1 rounded-full bg-slate-200" />
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                                <Clock className="w-3 h-3" /> {req.createdAt ? formatDistanceToNow(req.createdAt.toDate()) + ' ago' : 'Just now'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                                            {req.department?.charAt(0)}
                                        </div>
                                        <span className="text-[10px] font-black text-slate-500 uppercase">{req.department}</span>
                                    </div>
                                    <button className="flex items-center gap-1.5 text-[11px] font-black text-indigo-600 uppercase tracking-widest group-hover:gap-3 transition-all">
                                        Help Now <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>

            {/* Floating FAB for new request */}
            <button
                onClick={() => router.push("/requests/new")}
                className="fixed bottom-24 right-5 z-40 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white py-4 px-6 rounded-2xl shadow-indigo transition-all flex items-center gap-2 ring-4 ring-indigo-600/20"
            >
                <Plus className="w-5 h-5 shrink-0" />
                <span className="font-black text-xs uppercase tracking-widest">Post Request</span>
            </button>

            <BottomNav />
        </div>
    );
}
