"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, updateDoc, onSnapshot, getDoc } from "firebase/firestore";
import { toast } from "sonner";
import {
    ChevronLeft, Clock, IndianRupee, ShieldCheck, BookOpen, GraduationCap,
    Loader2, CheckCircle2, MessageSquare, AlertTriangle, PenTool
} from "lucide-react";
import { WritingJob } from "@/lib/types";
import { useRazorpay } from "@/hooks/useRazorpay";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    open: { label: "Open Bounty", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    assigned: { label: "In Progress", color: "bg-blue-100 text-blue-700 border-blue-200" },
    completed: { label: "Completed", color: "bg-slate-100 text-slate-600 border-slate-200" },
    cancelled: { label: "Cancelled", color: "bg-rose-100 text-rose-700 border-rose-200" },
};

export default function WritingJobDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const userId = auth?.currentUser?.uid;
    const { initiatePayment } = useRazorpay();

    const [job, setJob] = useState<WritingJob | null>(null);
    const [posterInfo, setPosterInfo] = useState<{ name: string, department: string, isVerified: boolean, strikeCount: number } | null>(null);
    const [workerInfo, setWorkerInfo] = useState<{ name: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Live listener for the active Job Job
    useEffect(() => {
        if (!id || !db) return;

        const unsub = onSnapshot(doc(db as any, "writing_jobs", id as string), async (docSnap) => {
            if (docSnap.exists()) {
                const data = { id: docSnap.id, ...docSnap.data() } as WritingJob;
                setJob(data);

                // Fetch the Poster's info
                if (data.posterId) {
                    const snap = await getDoc(doc(db as any, "users", data.posterId));
                    if (snap.exists()) setPosterInfo(snap.data() as any);
                }

                // If assigned, fetch the Worker's very basic info
                if (data.workerId) {
                    const wSnap = await getDoc(doc(db as any, "users", data.workerId));
                    if (wSnap.exists()) setWorkerInfo(wSnap.data() as any);
                }
            } else {
                toast.error("Job not found");
                router.push("/writing");
            }
            setLoading(false);
        }, (err) => {
            toast.error("Sync error");
            setLoading(false);
        });

        return () => unsub();
    }, [id, router]);

    const updateStatus = async (newStatus: string, extraFields: Record<string, any> = {}) => {
        if (!db || !id) return;
        setActionLoading(true);
        try {
            await updateDoc(doc(db, "writing_jobs", id as string), {
                status: newStatus,
                ...extraFields,
            });
            // Give Firestore a second before optimistic toggle (avoids flicker with snapshot)
        } catch {
            toast.error("Action failed. Try again.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleAcceptJob = async () => {
        if (!userId) { toast.error("Please sign in first"); return; }
        // Worker accepts -> instantly Assigned
        await updateStatus("assigned", { workerId: userId });
        toast.success("Job Assigned! Open Chat to coordinate.");
    };

    const handleMarkCompleted = async () => {
        if (!job?.price) return;
        initiatePayment({
            amount: job.price,
            entityId: id as string,
            entityType: 'writing_job',
            onSuccess: () => {
                toast.success("Payment successful! Job completed. 🎉");
            }
        });
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this open bounty?")) return;
        await updateStatus("cancelled");
        toast.success("Bounty cancelled.");
        router.push("/writing");
    };

    if (loading) return <div className="flex-1 flex items-center justify-center min-h-screen bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>;

    const isPoster = job?.posterId === userId;
    const isWorker = job?.workerId === userId;
    const statusConf = STATUS_CONFIG[job?.status || "open"];
    const deadlineDate = job?.deadline?.toDate ? job.deadline.toDate() : new Date(job?.deadline);
    const isUrgent = deadlineDate && (deadlineDate.getTime() - new Date().getTime() < 86400000);

    return (
        <div className="flex-1 flex flex-col min-h-screen pb-24 bg-slate-50 relative">

            {/* Minimal Background Art */}
            <div className="absolute top-0 left-0 w-full h-64 bg-blue-600 z-0 overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[150%] bg-pink-500/20 blob rounded-full mix-blend-screen filter blur-3xl animate-float" />
                <div className="absolute top-[20%] right-[-10%] w-[40%] h-[120%] bg-blue-400/20 blob rounded-full mix-blend-screen filter blur-3xl animate-float" style={{ animationDelay: "2s" }} />
            </div>

            {/* Header Toolbar */}
            <div className="px-5 pt-12 pb-6 relative z-10 flex items-start justify-between text-white">
                <button
                    onClick={() => router.back()}
                    className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 active:scale-95 transition-all shadow-sm hover:bg-white/20"
                >
                    <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <div className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border shadow-sm backdrop-blur-md bg-white/90 ${statusConf.color.split(' ')[1]}`}>
                    {statusConf.label}
                </div>
            </div>

            {/* Content Sheet */}
            <div className="flex-1 px-5 pt-8 -mt-6 bg-slate-50 rounded-t-3xl relative z-20 shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.1)]">

                {/* Title Card */}
                <div className="flex items-start justify-between mb-8">
                    <div className="pr-4 flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">{job?.type}</span>
                        </div>
                        <h1 className="text-2xl font-black text-slate-800 leading-tight" style={{ fontFamily: "Outfit, sans-serif" }}>
                            {job?.title}
                        </h1>
                        {job?.department && (
                            <div className="flex items-center gap-1.5 mt-2 text-blue-500 font-semibold text-sm">
                                <GraduationCap className="w-4 h-4" /> {job.department}
                            </div>
                        )}
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl text-center min-w-[88px] shadow-sm shrink-0">
                        <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Bounty</p>
                        <div className="flex items-center justify-center gap-0.5 text-emerald-600">
                            <IndianRupee className="w-3.5 h-3.5" />
                            <span className="text-xl font-black">{job?.price}</span>
                        </div>
                    </div>
                </div>

                {/* Deadline Alert */}
                <div className={`mb-6 p-4 rounded-2xl border flex items-start gap-3 shadow-sm ${isUrgent ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-white border-slate-200 text-slate-700'}`}>
                    <Clock className={`w-5 h-5 mt-0.5 shrink-0 ${isUrgent ? 'text-rose-500' : 'text-slate-400'}`} />
                    <div>
                        <p className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${isUrgent ? 'text-rose-500' : 'text-slate-400'}`}>Needed By</p>
                        <p className="text-sm font-bold">{deadlineDate?.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                </div>

                {/* Description */}
                <div className="bg-white/70 backdrop-blur-md rounded-2xl p-5 border border-white shadow-sm mb-8">
                    <div className="flex items-center gap-2 mb-3">
                        <BookOpen className="w-4 h-4 text-blue-400" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Requirements</p>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed font-medium whitespace-pre-wrap">
                        {job?.description}
                    </p>
                </div>

                {/* Poster Profile */}
                {posterInfo && (
                    <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 border border-blue-50 shadow-sm flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3 relative">
                            <div className="w-12 h-12 rounded-full gradient-blue flex items-center justify-center text-white font-black text-lg shadow-blue shrink-0">
                                {posterInfo.name.charAt(0).toUpperCase()}
                            </div>
                            {posterInfo.strikeCount === 0 && posterInfo.isVerified && (
                                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 border-2 border-white shadow-sm">
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                </div>
                            )}
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Posted By</p>
                                <p className="text-[15px] font-bold text-slate-800 leading-tight">{posterInfo.name}</p>
                                <p className="text-[11px] font-semibold text-blue-500">{posterInfo.department}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Fixed Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-blue-50 px-5 py-4 w-full z-50 pb-safe">
                {isPoster ? (
                    <div className="space-y-3">
                        {job?.status === "open" ? (
                            <div className="flex gap-2">
                                <button
                                    onClick={handleDelete}
                                    disabled={actionLoading}
                                    className="px-4 h-14 rounded-2xl bg-rose-50 text-rose-500 font-black shadow-sm flex items-center justify-center disabled:opacity-50 active:scale-95 transition-all"
                                >
                                    Cancel
                                </button>
                                <div className="flex-1 h-14 rounded-2xl bg-slate-100 text-slate-400 border border-slate-200 font-black text-sm flex items-center justify-center shadow-inner uppercase tracking-widest">
                                    Awaiting Worker
                                </div>
                            </div>
                        ) : job?.status === "assigned" ? (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => router.push(`/chat/${id}`)}
                                    className="h-14 w-14 shrink-0 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 hover:bg-blue-100 transition-colors shadow-sm"
                                >
                                    <MessageSquare className="w-5 h-5 fill-blue-100" />
                                </button>
                                <button
                                    onClick={handleMarkCompleted}
                                    disabled={actionLoading}
                                    className="flex-1 h-14 rounded-2xl bg-emerald-500 text-white font-black text-sm flex items-center justify-center gap-1.5 disabled:opacity-60 active:scale-[0.98] transition-all hover:bg-emerald-600 shadow-sm"
                                >
                                    {actionLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <><CheckCircle2 className="w-4 h-4" /> MARK COMPLETED</>}
                                </button>
                            </div>
                        ) : (
                            <div className="h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center shadow-inner">
                                <span className="text-slate-400 font-black text-sm uppercase tracking-widest">BOUNTY RESOLVED</span>
                            </div>
                        )}
                    </div>
                ) : job?.status === "open" ? (
                    <button
                        onClick={handleAcceptJob}
                        disabled={actionLoading}
                        className="w-full h-14 rounded-2xl gradient-blue text-white font-black text-base shadow-blue flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98] transition-all hover:-translate-y-0.5"
                    >
                        {actionLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <><PenTool className="w-4 h-4" /> ACCEPT BOUNTY</>}
                    </button>
                ) : isWorker && job?.status === "assigned" ? (
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center px-2 mb-1">
                            <p className="text-[10px] uppercase font-black tracking-widest text-blue-500">You are assigned</p>
                        </div>
                        <button
                            onClick={() => router.push(`/chat/${id}`)}
                            className="w-full h-14 rounded-2xl bg-blue-600 text-white font-black text-base shadow-blue flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:-translate-y-0.5"
                        >
                            <MessageSquare className="w-5 h-5" /> OPEN CHAT
                        </button>
                    </div>
                ) : (
                    <div className="h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center shadow-inner gap-2">
                        <AlertTriangle className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-400 font-black text-sm uppercase tracking-widest">No Longer Open</span>
                    </div>
                )}
            </div>

        </div>
    );
}
