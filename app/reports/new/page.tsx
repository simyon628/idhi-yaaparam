"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
export const dynamic = "force-dynamic";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged, Auth } from "firebase/auth";
import { toast } from "sonner";
import { ChevronLeft, Loader2, AlertTriangle, Info } from "lucide-react";

const REASONS = [
    "Not returned",
    "Damaged item",
    "Fake listing",
    "Inappropriate behavior",
    "Other"
];

export default function NewReportPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);
    const [reason, setReason] = useState(REASONS[0]);
    const [description, setDescription] = useState("");
    const [targetName, setTargetName] = useState(""); // E.g., Item name or User name

    useEffect(() => {
        if (!auth) return;
        const unsub = onAuthStateChanged(auth as Auth, (user) => {
            if (!user) {
                router.push("/login?redirect=/reports/new");
            } else {
                setAuthChecked(true);
            }
        });
        return () => unsub();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!targetName) {
            toast.error("Please specify the item or user name.");
            return;
        }

        const user = auth?.currentUser;
        if (!user || !db) {
            toast.error("Initialization error. Please refresh.");
            return;
        }

        setLoading(true);
        try {
            await addDoc(collection(db, "reports"), {
                reporterId: user.uid,
                targetName,
                reason,
                description,
                status: "pending",
                createdAt: serverTimestamp(),
            });
            toast.success("Report submitted to Campus Admins.");
            router.push("/home");
        } catch (error) {
            console.error(error);
            toast.error("Failed to submit report. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!authChecked) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-screen bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col min-h-screen bg-slate-50 relative overflow-hidden">
            {/* Ambient Background Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-200/40 blob rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{ animationDelay: "0s" }} />
            <div className="absolute top-[20%] right-[-10%] w-[40%] h-[60%] bg-pink-200/30 blob rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{ animationDelay: "2s" }} />

            {/* Header */}
            <header className="px-5 pt-12 pb-6 flex items-center gap-4 bg-white/60 backdrop-blur-md sticky top-0 z-20 border-b border-blue-100 shadow-sm">
                <button
                    onClick={() => router.back()}
                    className="p-2.5 bg-white border border-blue-100 rounded-xl active:scale-95 transition-all text-slate-500 hover:text-blue-600 shadow-sm"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-xl font-black text-slate-800 leading-none flex items-center gap-2" style={{ fontFamily: "Outfit, sans-serif" }}>
                        <AlertTriangle className="w-5 h-5 text-rose-500" /> Report Issue
                    </h1>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1">Keep our campus safe</p>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="flex-1 px-5 py-6 space-y-6 relative z-10 max-w-md mx-auto w-full">

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 shadow-sm">
                    <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs font-semibold text-amber-700 leading-relaxed">
                        Fraudulent or repeated offenses will result in an automatic block under our 2-Strike Governance System. Please be as detailed as possible.
                    </p>
                </div>

                {/* Target Name */}
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500 pl-1">Item or User Name *</label>
                    <input
                        type="text"
                        placeholder="E.g., Casio fx-991 from John"
                        className="w-full bg-white/70 backdrop-blur-md border border-blue-50 focus:border-rose-300 focus:ring-4 focus:ring-rose-50 rounded-2xl h-14 px-4 text-slate-800 placeholder-slate-400 font-bold outline-none shadow-inner transition-all"
                        value={targetName}
                        onChange={(e) => setTargetName(e.target.value)}
                    />
                </div>

                {/* Reason */}
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500 pl-1">Reason for Report *</label>
                    <select
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        className="w-full bg-white/70 backdrop-blur-md border border-blue-50 focus:border-rose-300 focus:ring-4 focus:ring-rose-50 rounded-2xl h-14 px-4 text-slate-700 font-bold outline-none appearance-none shadow-inner transition-all"
                    >
                        {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>

                {/* Optional Details */}
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex justify-between pl-1">
                        <span>Details</span>
                        <span className="text-slate-400 font-medium">Optional</span>
                    </label>
                    <textarea
                        placeholder="Explain what happened..."
                        rows={4}
                        className="w-full bg-white/70 backdrop-blur-md border border-blue-50 focus:border-rose-300 focus:ring-4 focus:ring-rose-50 rounded-2xl p-4 text-slate-800 placeholder-slate-400 font-medium outline-none shadow-inner transition-all resize-none"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                <div className="pt-6">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-16 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black text-sm shadow-[0_10px_20px_-10px_rgba(244,63,94,0.5)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] hover:-translate-y-1 transition-all"
                    >
                        {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Submit To Admins"}
                    </button>
                    <p className="text-center text-[10px] text-slate-400 mt-4 uppercase tracking-widest font-black">
                        Reports are reviewed within 24 hours
                    </p>
                </div>
            </form>
        </div>
    );
}
