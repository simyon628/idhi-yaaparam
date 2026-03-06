"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
export const dynamic = "force-dynamic";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";
import {
    ChevronLeft, MapPin, Clock, IndianRupee, ShieldCheck,
    Loader2, CheckCircle2, Package, AlertTriangle, X, Send
} from "lucide-react";
import { Listing, ReportReason } from "@/lib/types";

const REPORT_REASONS: ReportReason[] = [
    "Item not returned",
    "Item damaged",
    "No-show",
    "Fraud",
    "Other",
];

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    available: { label: "Available", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    requested: { label: "Pending", color: "bg-amber-100 text-amber-700 border-amber-200" },
    active: { label: "Active", color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
    completed: { label: "Completed", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    cancelled: { label: "Cancelled", color: "bg-rose-100 text-rose-700 border-rose-200" },
};

export default function RentalDetailPage() {
    const { id } = useParams();
    const [rental, setRental] = useState<Listing | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState<ReportReason | "">("");
    const [reportNotes, setReportNotes] = useState("");

    const router = useRouter();
    const userId = auth?.currentUser?.uid;

    useEffect(() => {
        async function fetchRental() {
            if (!id || !db) return;
            try {
                const snap = await getDoc(doc(db, "rentals", id as string));
                if (snap.exists()) {
                    setRental({ id: snap.id, ...snap.data() } as Listing);
                } else {
                    toast.error("Rental not found");
                    router.push("/home");
                }
            } catch { toast.error("Error loading rental"); }
            finally { setLoading(false); }
        }
        fetchRental();
    }, [id, router]);

    const updateStatus = async (newStatus: string, extraFields: Record<string, any> = {}) => {
        if (!db || !id) return;
        setActionLoading(true);
        try {
            await updateDoc(doc(db, "rentals", id as string), {
                status: newStatus,
                ...extraFields,
            });
            setRental(r => r ? { ...r, status: newStatus as any, ...extraFields } : r);
        } catch { toast.error("Action failed. Try again."); }
        finally { setActionLoading(false); }
    };

    const handleRequest = async () => {
        if (!userId) { toast.error("Please sign in first"); return; }
        await updateStatus("requested", { renterId: userId, requestedAt: serverTimestamp() });
        toast.success("Request sent to owner! 🎉");
    };

    const handleApprove = async () => {
        await updateStatus("active", { approvedAt: serverTimestamp() });
        toast.success("Rental approved!");
    };

    const handleMarkReturned = async () => {
        await updateStatus("completed", { completedAt: serverTimestamp() });
        toast.success("Rental marked as complete!");
    };

    const handleReport = async () => {
        if (!reportReason) { toast.error("Please select a reason"); return; }
        if (!db || !userId || !rental) return;

        setActionLoading(true);
        try {
            // 1. Write report
            await addDoc(collection(db, "reports"), {
                rentalId: id,
                reporterId: userId,
                reportedUserId: rental.renterId,
                reason: reportReason,
                notes: reportNotes,
                timestamp: serverTimestamp(),
                status: "pending",
            });

            // 2. Fetch renter's doc and increment strike
            if (rental.renterId) {
                const renterRef = doc(db, "users", rental.renterId);
                const renterSnap = await getDoc(renterRef);
                if (renterSnap.exists()) {
                    const currentStrikes = renterSnap.data().strikeCount || 0;
                    const newStrikes = currentStrikes + 1;
                    await updateDoc(renterRef, {
                        strikeCount: newStrikes,
                        ...(newStrikes >= 2 ? { isBlocked: true } : {}),
                    });
                    if (newStrikes >= 2) {
                        toast.warning("User has been automatically blocked (2 strikes reached).");
                    } else {
                        toast.success(`Report submitted. User warned (Strike ${newStrikes}/2).`);
                    }
                }
            }
            setShowReportModal(false);
            setReportReason("");
            setReportNotes("");
        } catch { toast.error("Failed to submit report."); }
        finally { setActionLoading(false); }
    };

    if (loading) return (
        <div className="flex-1 flex items-center justify-center min-h-screen bg-slate-50">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
        </div>
    );

    const isOwner = rental?.ownerId === userId;
    const isRenter = rental?.renterId === userId;
    const statusConf = STATUS_CONFIG[rental?.status || "available"];

    return (
        <div className="flex-1 flex flex-col min-h-screen pb-24 bg-slate-50">
            {/* Hero Image */}
            <div className="relative w-full bg-slate-200" style={{ aspectRatio: "16/9" }}>
                <img
                    src={rental?.photoUrl || `https://placehold.co/400x225/e2e8f0/4f46e5?text=${encodeURIComponent(rental?.icon || "📦")}`}
                    alt={rental?.itemName}
                    className="w-full h-full object-cover"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 40%)" }} />

                {/* Back button */}
                <button
                    onClick={() => router.back()}
                    className="absolute top-5 left-5 p-2.5 bg-white/60 backdrop-blur-md rounded-xl border border-white/50 active:scale-95 transition-all shadow-sm"
                >
                    <ChevronLeft className="w-5 h-5 text-slate-700" />
                </button>

                {/* Status badge */}
                <div className={`absolute top-5 right-5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border shadow-sm ${statusConf.color}`}>
                    {statusConf.label}
                </div>
            </div>

            {/* Content sheet */}
            <div className="flex-1 px-5 pt-6 -mt-4 bg-slate-50 rounded-t-3xl relative z-10 border-t border-white shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">

                {/* Title & price */}
                <div className="flex items-start justify-between mb-6">
                    <div className="space-y-1 flex-1 mr-4">
                        <span className="text-3xl drop-shadow-sm">{rental?.icon}</span>
                        <h1 className="text-2xl font-black text-slate-800 leading-tight mt-1" style={{ fontFamily: "Outfit, sans-serif" }}>
                            {rental?.itemName}
                        </h1>
                        <div className="flex items-center gap-1.5 text-indigo-500">
                            <MapPin className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold uppercase tracking-wider">{rental?.block}</span>
                        </div>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl text-center min-w-[88px] shadow-sm">
                        <p className="text-[9px] font-bold text-amber-500 uppercase tracking-widest mb-1">Per Hour</p>
                        <div className="flex items-center justify-center gap-0.5 text-amber-600">
                            <IndianRupee className="w-3.5 h-3.5" />
                            <span className="text-xl font-black">{rental?.pricePerHour}</span>
                        </div>
                    </div>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 border border-white shadow-sm hover:shadow-md transition-shadow">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Trust Score</p>
                        <div className="flex items-center gap-1.5 text-emerald-600">
                            <ShieldCheck className="w-4 h-4" />
                            <span className="text-sm font-black">Verified</span>
                        </div>
                    </div>
                    <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 border border-white shadow-sm hover:shadow-md transition-shadow">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Availability</p>
                        <div className="flex items-center gap-1.5 text-slate-700">
                            <Clock className="w-4 h-4 text-indigo-500" />
                            <span className="text-sm font-black">Until 5 PM</span>
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 border border-white shadow-sm mb-8">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Details</p>
                    <p className="text-slate-600 text-sm leading-relaxed font-medium">
                        Top condition {rental?.itemName} available in {rental?.block}. Return on time to maintain your trust score.
                    </p>
                </div>
            </div>

            {/* ─── Fixed Action Bar ─── */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-indigo-50 px-5 py-4 max-w-md mx-auto z-50 pb-safe">
                {isOwner ? (
                    <div className="space-y-3">
                        {rental?.status === "requested" ? (
                            <div className="space-y-2">
                                <p className="text-xs font-bold text-amber-500 text-center uppercase tracking-widest">
                                    Renter is waiting for approval
                                </p>
                                <button
                                    onClick={handleApprove}
                                    disabled={actionLoading}
                                    className="w-full h-14 rounded-2xl gradient-indigo text-white font-black text-base shadow-indigo flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98] transition-all hover:-translate-y-0.5"
                                >
                                    {actionLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <><CheckCircle2 className="w-5 h-5" /> APPROVE RENTAL</>}
                                </button>
                            </div>
                        ) : rental?.status === "active" ? (
                            <button
                                onClick={handleMarkReturned}
                                disabled={actionLoading}
                                className="w-full h-14 rounded-2xl bg-emerald-500 text-white font-black text-base flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98] transition-all hover:bg-emerald-600 shadow-sm"
                            >
                                {actionLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <><Package className="w-5 h-5" /> MARK AS RETURNED</>}
                            </button>
                        ) : rental?.status === "completed" ? (
                            <div className="flex flex-col items-center gap-2">
                                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 border border-emerald-100 px-4 py-2 rounded-full text-sm font-bold shadow-sm">
                                    <CheckCircle2 className="w-4 h-4" /> Rental Complete
                                </div>
                                <button
                                    onClick={() => setShowReportModal(true)}
                                    className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors"
                                >
                                    Report an issue
                                </button>
                            </div>
                        ) : (
                            <div className="h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center shadow-inner">
                                <span className="text-slate-400 font-black text-sm uppercase tracking-widest">YOUR LISTING</span>
                            </div>
                        )}
                    </div>
                ) : rental?.status === "available" ? (
                    <button
                        onClick={handleRequest}
                        disabled={actionLoading}
                        className="w-full h-14 rounded-2xl gradient-indigo text-white font-black text-base shadow-indigo flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98] transition-all hover:-translate-y-0.5"
                    >
                        {actionLoading ? <Loader2 className="animate-spin w-5 h-5" /> : "REQUEST NOW →"}
                    </button>
                ) : isRenter && rental?.status === "requested" ? (
                    <div className="text-center py-3">
                        <span className="bg-amber-100 text-amber-700 border border-amber-200 px-4 py-2 rounded-full text-sm font-bold shadow-sm">Awaiting owner approval...</span>
                    </div>
                ) : isRenter && rental?.status === "active" ? (
                    <div className="text-center py-3">
                        <span className="bg-indigo-100 text-indigo-700 border border-indigo-200 px-4 py-2 rounded-full text-sm font-bold shadow-sm">Rental is Active — return on time!</span>
                    </div>
                ) : (
                    <div className="h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center shadow-inner">
                        <span className="text-slate-400 font-black text-sm uppercase tracking-widest">CURRENTLY TAKEN</span>
                    </div>
                )}
            </div>

            {/* ─── Report Modal ─── */}
            {showReportModal && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center max-w-md mx-auto">
                    <div className="absolute inset-0 bg-slate-800/40 backdrop-blur-sm" onClick={() => setShowReportModal(false)} />
                    <div className="relative w-full bg-slate-50 border-t border-indigo-100 rounded-t-[2rem] p-6 space-y-5 z-10 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-black text-slate-800" style={{ fontFamily: "Outfit, sans-serif" }}>Report an Issue</h3>
                                <p className="text-xs text-slate-500 mt-0.5 font-medium">Select the reason for your report</p>
                            </div>
                            <button onClick={() => setShowReportModal(false)} className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm">
                                <X className="w-4 h-4 text-slate-400" />
                            </button>
                        </div>

                        <div className="space-y-2">
                            {REPORT_REASONS.map((reason) => (
                                <button
                                    key={reason}
                                    onClick={() => setReportReason(reason)}
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 text-sm font-bold transition-all shadow-sm ${reportReason === reason
                                        ? "bg-rose-50 border-rose-200 text-rose-600"
                                        : "bg-white border-slate-100 text-slate-600 hover:border-slate-200"
                                        }`}
                                >
                                    {reason}
                                    {reportReason === reason && <AlertTriangle className="w-4 h-4 opacity-70" />}
                                </button>
                            ))}
                        </div>

                        <div>
                            <textarea
                                placeholder="Additional notes (optional)..."
                                value={reportNotes}
                                onChange={(e) => setReportNotes(e.target.value)}
                                className="w-full h-24 bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-50 resize-none shadow-inner transition-all"
                            />
                        </div>

                        <button
                            onClick={handleReport}
                            disabled={actionLoading || !reportReason}
                            className="w-full h-14 rounded-2xl bg-rose-500 text-white font-black flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-all hover:bg-rose-600 shadow-sm"
                        >
                            {actionLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <><Send className="w-4 h-4" /> SUBMIT REPORT</>}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
