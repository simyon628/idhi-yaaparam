"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
export const dynamic = "force-dynamic";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
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
        const unsub = onAuthStateChanged(auth, (user) => {
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

        setLoading(true);
        try {
            await addDoc(collection(db, "reports"), {
                reporterId: auth.currentUser?.uid,
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
            <div className="flex-1 flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col min-h-screen bg-[hsl(222,47%,9%)]">
            {/* Header */}
            <header className="px-5 pt-12 pb-6 flex items-center gap-4 border-b border-slate-800">
                <button
                    onClick={() => router.back()}
                    className="p-2.5 glass rounded-xl border border-slate-700/50 active:scale-95 transition-all text-slate-400 hover:text-white"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-xl font-black text-white leading-none flex items-center gap-2" style={{ fontFamily: "Outfit, sans-serif" }}>
                        <AlertTriangle className="w-5 h-5 text-rose-500" /> Report Issue
                    </h1>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1">Keep our campus safe</p>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="flex-1 px-5 py-6 space-y-6">

                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
                    <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs font-medium text-amber-200/80 leading-relaxed">
                        Fraudulent or repeated offenses will result in an automatic block under our 2-Strike Governance System. Please be as detailed as possible.
                    </p>
                </div>

                {/* Target Name */}
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Item or User Name *</label>
                    <input
                        type="text"
                        placeholder="E.g., Casio fx-991 from John"
                        className="w-full bg-[hsl(217,32%,16%)] border border-slate-700 focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/30 rounded-xl h-14 px-4 text-white placeholder-slate-600 font-medium outline-none transition-all"
                        value={targetName}
                        onChange={(e) => setTargetName(e.target.value)}
                    />
                </div>

                {/* Reason */}
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Reason for Report *</label>
                    <select
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        className="w-full bg-[hsl(217,32%,16%)] border border-slate-700 focus:border-rose-500/50 rounded-xl h-14 px-4 text-white font-medium outline-none appearance-none"
                    >
                        {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>

                {/* Optional Details */}
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex justify-between">
                        <span>Details</span>
                        <span className="text-slate-600">Optional</span>
                    </label>
                    <textarea
                        placeholder="Explain what happened..."
                        rows={4}
                        className="w-full bg-[hsl(217,32%,16%)] border border-slate-700 focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/30 rounded-xl p-4 text-whitetext-sm placeholder-slate-600 outline-none transition-all resize-none"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                <div className="pt-6">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-14 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black text-sm shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
                    >
                        {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Submit To Admins"}
                    </button>
                </div>
            </form>
        </div>
    );
}
