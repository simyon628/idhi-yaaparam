"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCollege } from "@/contexts/CollegeContext";
import { useAppMode } from "@/contexts/AppModeContext";
import { InlineCollegeSelection } from "@/components/ui/InlineCollegeSelection";
import { MapPin, PenTool, ArrowRight, ShoppingBag, Star, Zap, BadgeIndianRupee } from "lucide-react";

export default function LandingPage() {
    const router = useRouter();
    const { selectedCollege, isReady } = useCollege();
    const { setMode, setHasPicked } = useAppMode();
    const [showDetector, setShowDetector] = useState(false);
    const [pendingMode, setPendingMode] = useState<"rentals" | "writing" | null>(null);
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Once college is selected, navigate to the appropriate section
    useEffect(() => {
        if (isReady && showDetector && selectedCollege && pendingMode) {
            setMode(pendingMode);
            setHasPicked(true);
            setIsTransitioning(true);
            router.push(pendingMode === "writing" ? "/writing" : "/rentals");
        }
    }, [selectedCollege, isReady, showDetector, pendingMode, router, setMode, setHasPicked]);

    const handleMode = (m: "rentals" | "writing") => {
        setPendingMode(m);
        setMode(m);
        setHasPicked(true);
        if (selectedCollege) {
            setIsTransitioning(true);
            router.push(m === "writing" ? "/writing" : "/rentals");
        } else {
            setShowDetector(true);
        }
    };

    if (!isReady || isTransitioning) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-screen relative overflow-hidden" style={{ background: "linear-gradient(160deg, #0f172a 0%, #1e1b4b 45%, #312e81 100%)" }}>
                 <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col min-h-screen relative overflow-hidden" style={{ background: "linear-gradient(160deg, #0f172a 0%, #1e1b4b 45%, #312e81 100%)" }}>
            {/* Soft radial glow blobs */}
            <div className="absolute top-0 left-0 w-72 h-72 rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: "radial-gradient(circle, #818cf8, transparent)" }} />
            <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: "radial-gradient(circle, #a78bfa, transparent)" }} />

            {/* Header */}
            <header className="px-6 pt-14 pb-2 flex items-center justify-between relative z-10">
                <div>
                    <span className="text-white font-black text-2xl tracking-tight" style={{ fontFamily: "Outfit, sans-serif" }}>
                        Idhi Yaaparam
                    </span>
                    <p className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest mt-0.5">Student Earning Platform</p>
                </div>
                <div className="flex items-center gap-1.5 bg-white/10 border border-white/20 px-3 py-1.5 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-white text-[10px] font-black uppercase tracking-widest">Live</span>
                </div>
            </header>

            {/* Hero text */}
            <div className="px-6 pt-8 pb-6 relative z-10">
                <div>
                    <h1 className="text-4xl font-black text-white leading-tight mb-3" style={{ fontFamily: "Outfit, sans-serif" }}>
                        Save money.<br />
                        <span style={{ background: "linear-gradient(90deg, #a5b4fc, #c4b5fd)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                            Earn with skills.
                        </span>
                    </h1>
                    <p className="text-indigo-200 text-sm font-medium leading-relaxed max-w-[280px]">
                        The only platform built for college students in India. Rent items or earn by writing — your choice.
                    </p>
                </div>
            </div>

            {/* Mode Cards */}
            <div className="flex-1 px-5 space-y-4 relative z-10 pb-10">
                    {!showDetector ? (
                        <>
                            {/* Rentals Card */}
                            <button
                                onClick={() => handleMode("rentals")}
                                className="w-full text-left bg-white rounded-3xl p-5 shadow-2xl overflow-hidden relative group active:scale-[.98] transition-transform"
                            >
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity" style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }} />
                                <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-5" style={{ background: "radial-gradient(circle, #4f46e5, transparent)" }} />
                                <div className="flex items-start gap-4 relative z-10">
                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-2xl shadow-md" style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>
                                        🎒
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h2 className="text-[17px] font-black text-slate-800">Campus Rentals</h2>
                                            <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-black rounded-md border border-indigo-100 uppercase tracking-wider">Popular</span>
                                        </div>
                                        <p className="text-slate-500 text-xs font-medium leading-relaxed mb-4">
                                            Borrow Calculators, Drafters, Lab Coats from classmates. Pay per hour.
                                        </p>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                                                <ShoppingBag className="w-3 h-3" /> Borrow items
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                                                <BadgeIndianRupee className="w-3 h-3" /> ₹10–₹50 per hour
                                            </div>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-indigo-400 mt-1 shrink-0 group-hover:translate-x-1 transition-transform" />
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                                    <div className="flex -space-x-2">
                                        {["bg-indigo-400", "bg-violet-400", "bg-sky-400"].map((c, i) => (
                                            <div key={i} className={`w-6 h-6 rounded-full ${c} border-2 border-white flex items-center justify-center text-white text-[9px] font-black`}>
                                                {["S", "R", "A"][i]}
                                            </div>
                                        ))}
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400">200+ students active</span>
                                </div>
                            </button>

                            {/* Writing Card */}
                            <button
                                onClick={() => handleMode("writing")}
                                className="w-full text-left bg-white rounded-3xl p-5 shadow-xl overflow-hidden relative group active:scale-[.98] transition-transform"
                            >
                                <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-5" style={{ background: "radial-gradient(circle, #10b981, transparent)" }} />
                                <div className="flex items-start gap-4 relative z-10">
                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-2xl shadow-md" style={{ background: "linear-gradient(135deg, #059669, #0d9488)" }}>
                                        ✏️
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h2 className="text-[17px] font-black text-slate-800">Writing Work</h2>
                                            <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-black rounded-md border border-emerald-100 uppercase tracking-wider">Earn</span>
                                        </div>
                                        <p className="text-slate-500 text-xs font-medium leading-relaxed mb-4">
                                            Write lab records, assignments, and project reports for students. Get paid per job.
                                        </p>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                                                <PenTool className="w-3 h-3" /> Lab records
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                                                <BadgeIndianRupee className="w-3 h-3" /> ₹200–₹500/job
                                            </div>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-emerald-400 mt-1 shrink-0 group-hover:translate-x-1 transition-transform" />
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400">Work on holidays too</span>
                                </div>
                            </button>

                            {/* Info strip */}
                            <div
                                className="flex items-center justify-center gap-2 pt-2"
                            >
                                <Zap className="w-3.5 h-3.5 text-amber-400" />
                                <p className="text-indigo-300 text-[11px] font-bold text-center">
                                    You can switch modes anytime from your Profile
                                </p>
                            </div>
                        </>
                    ) : (
                        <div
                            className="bg-white rounded-3xl p-6 shadow-2xl"
                        >
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg" style={{ background: pendingMode === "writing" ? "linear-gradient(135deg, #059669, #0d9488)" : "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>
                                    {pendingMode === "writing" ? "✏️" : "🎒"}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Step 1 of 1</p>
                                    <p className="text-sm font-black text-slate-800">Select Your College</p>
                                </div>
                            </div>
                            <InlineCollegeSelection />
                        </div>
                    )}
            </div>
        </div>
    );
}
