"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import {
    Plus, Search, PenTool, Clock, IndianRupee, MapPin, Loader2, ChevronRight, GraduationCap
} from "lucide-react";
import { useCollege } from "@/contexts/CollegeContext";
import { WritingJob } from "@/lib/types";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";

export default function WritingFeedPage() {
    const [jobs, setJobs] = useState<WritingJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const router = useRouter();
    const { selectedCollege, isReady } = useCollege();
    const userId = auth?.currentUser?.uid;

    useEffect(() => {
        if (!selectedCollege || !db) {
            setLoading(false);
            return;
        }

        const fetchJobs = async () => {
            try {
                const q = query(
                    collection(db as any, "writing_jobs"),
                    where("college", "==", selectedCollege.name),
                    where("status", "==", "open"),
                    orderBy("createdAt", "desc")
                );
                const snap = await getDocs(q);
                const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as WritingJob));
                setJobs(fetched);
            } catch (err) {
                console.error("Error fetching writing jobs:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchJobs();
    }, [selectedCollege]);

    if (isReady && !selectedCollege) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-screen text-center px-6 bg-slate-50">
                <span className="text-5xl drop-shadow-sm mb-6">🎓</span>
                <h2 className="text-2xl font-black text-slate-800 mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>Select a Campus</h2>
                <p className="text-sm font-semibold text-slate-500 mb-8 max-w-[280px]">You must select your college from the home page to view writing jobs.</p>
                <button onClick={() => router.push("/")} className="gradient-indigo text-white px-8 py-3.5 rounded-2xl font-bold shadow-indigo hover:-translate-y-0.5 transition-transform active:scale-95">Go to Home</button>
            </div>
        );
    }

    const filteredJobs = jobs.filter(job =>
        job.title.toLowerCase().includes(search.toLowerCase()) ||
        job.type.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex-1 flex flex-col min-h-screen bg-slate-50 pb-24 relative">
            <TopBar />

            {/* Header Section */}
            <div className="bg-indigo-600 px-5 pt-8 pb-10 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none" />
                <div className="relative z-10">
                    <h1 className="text-2xl font-black mb-1" style={{ fontFamily: "Outfit, sans-serif" }}>Writing Work</h1>
                    <p className="text-indigo-200 text-sm font-medium pr-10">Help your peers with assignments, lab records, and projects to earn money.</p>

                    {/* Search Bar */}
                    <div className="relative mt-6">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-indigo-300" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search assignments, records..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="block w-full pl-11 pr-4 py-3.5 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-indigo-300 focus:outline-none focus:bg-white focus:text-slate-800 focus:placeholder-slate-400 transition-all font-semibold"
                        />
                    </div>
                </div>
            </div>

            <main className="flex-1 px-5 pt-6 -mt-4 bg-slate-50 rounded-t-3xl relative z-20 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-black text-slate-800" style={{ fontFamily: "Outfit, sans-serif" }}>Open Bounties</h2>
                    <span className="bg-indigo-100 text-indigo-700 text-xs font-black px-2.5 py-1 rounded-lg">{jobs.length} Jobs</span>
                </div>

                {loading ? (
                    <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-400" /></div>
                ) : filteredJobs.length === 0 ? (
                    <div className="text-center py-16 px-4">
                        <div className="w-16 h-16 bg-slate-200/50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <PenTool className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-black text-slate-700 mb-1" style={{ fontFamily: "Outfit, sans-serif" }}>No open jobs</h3>
                        <p className="text-sm font-semibold text-slate-500 mb-6">Be the first to post a new assignment bounty on campus!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredJobs.map(job => {
                            const isOwner = job.posterId === userId;
                            const deadlineDate = job.deadline?.toDate ? job.deadline.toDate() : new Date(job.deadline);
                            const isUrgent = deadlineDate.getTime() - new Date().getTime() < 86400000; // Less than 24 hours

                            return (
                                <div
                                    key={job.id}
                                    onClick={() => router.push(`/writing/${job.id}`)}
                                    className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-indigo-50 shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer group"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="space-y-1 pr-4">
                                            <span className={`text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded-md ${job.type === "Record" ? "bg-emerald-50 text-emerald-600" :
                                                job.type === "Assignment" ? "bg-amber-50 text-amber-600" : "bg-indigo-50 text-indigo-600"
                                                }`}>
                                                {job.type}
                                            </span>
                                            <h3 className="text-[16px] font-black text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">
                                                {job.title}
                                            </h3>
                                        </div>
                                        <div className="bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl flex items-center gap-0.5 text-emerald-600 shadow-sm shrink-0">
                                            <IndianRupee className="w-3.5 h-3.5" />
                                            <span className="font-black">{job.price}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                                        <div className={`flex items-center gap-1 ${isUrgent ? 'text-rose-500' : ''}`}>
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>{deadlineDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                                        </div>
                                        {job.department && (
                                            <div className="flex items-center gap-1">
                                                <GraduationCap className="w-3.5 h-3.5" />
                                                <span>{job.department}</span>
                                            </div>
                                        )}
                                    </div>

                                    {isOwner && (
                                        <div className="mt-3 pt-3 border-t border-slate-100">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-50 px-2 py-1 rounded">Your Post</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* FAB to Post New Job */}
            <div className="fixed bottom-20 right-5 z-40">
                <button
                    onClick={() => router.push("/writing/new")}
                    className="w-14 h-14 rounded-full gradient-indigo text-white flex items-center justify-center shadow-[0_10px_25px_-5px_rgba(79,70,229,0.5)] active:scale-95 hover:scale-105 transition-all outline-none"
                >
                    <Plus className="w-6 h-6" />
                </button>
            </div>

            <BottomNav />
        </div>
    );
}
