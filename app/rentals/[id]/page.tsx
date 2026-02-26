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
    available: { label: "Available", color: "badge-trust" },
    requested: { label: "Pending", color: "badge-amber" },
    active: { label: "Active", color: "badge-indigo" },
    completed: { label: "Completed", color: "badge-trust" },
    cancelled: { label: "Cancelled", color: "badge-rose" },
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
        <div className="flex-1 flex items-center justify-center min-h-screen">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
        </div>
    );

    const isOwner = rental?.ownerId === userId;
    const isRenter = rental?.renterId === userId;
    const statusConf = STATUS_CONFIG[rental?.status || "available"];

    return (
        <div className="flex-1 flex flex-col min-h-screen pb-24">
            {/* Hero Image */}
            <div className="relative w-full bg-[hsl(217,32%,12%)]" style={{ aspectRatio: "16/9" }}>
                <img
                    src={rental?.photoUrl || `https://placehold.co/400x225/1e2a3a/6366f1?text=${encodeURIComponent(rental?.icon || "📦")}`}
                    alt={rental?.itemName}
                    className="w-full h-full object-cover"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0) 40%)" }} />

                {/* Back button */}
                <button
                    onClick={() => router.back()}
                    className="absolute top-5 left-5 p-2.5 glass rounded-xl border border-slate-700/50 active:scale-95 transition-all"
                >
                    <ChevronLeft className="w-5 h-5 text-white" />
                </button>

                {/* Status badge */}
                <div className={`absolute top-5 right-5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${statusConf.color}`}>
                    {statusConf.label}
                </div>
            </div>

            {/* Content sheet */}
            <div className="flex-1 px-5 pt-6 -mt-4 bg-[hsl(222,47%,9%)] rounded-t-3xl relative z-10">

                {/* Title & price */}
                <div className="flex items-start justify-between mb-6">
                    <div className="space-y-1 flex-1 mr-4">
                        <span className="text-3xl">{rental?.icon}</span>
                        <h1 className="text-2xl font-black text-white leading-tight mt-1" style={{ fontFamily: "Outfit, sans-serif" }}>
                            {rental?.itemName}
                        </h1>
                        <div className="flex items-center gap-1.5 text-indigo-400">
                            <MapPin className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold uppercase tracking-wider">{rental?.block}</span>
                        </div>
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/25 p-4 rounded-2xl text-center min-w-[88px]">
                        <p className="text-[9px] font-bold text-amber-500 uppercase tracking-widest mb-1">Per Hour</p>
                        <div className="flex items-center justify-center gap-0.5 text-amber-400">
                            <IndianRupee className="w-3.5 h-3.5" />
                            <span className="text-xl font-black">{rental?.pricePerHour}</span>
                        </div>
                    </div>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="glass rounded-2xl p-4 border border-slate-700/50">
                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">Trust Score</p>
                        <div className="flex items-center gap-1.5 text-emerald-400">
                            <ShieldCheck className="w-4 h-4" />
                            <span className="text-sm font-black">Verified</span>
                        </div>
                    </div>
                    <div className="glass rounded-2xl p-4 border border-slate-700/50">
                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">Availability</p>
                        <div className="flex items-center gap-1.5 text-slate-300">
                            <Clock className="w-4 h-4 text-indigo-400" />
                            <span className="text-sm font-black">Until 5 PM</span>
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div className="glass rounded-2xl p-4 border border-slate-700/50 mb-8">
                    <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-2">Details</p>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        Top condition {rental?.itemName} available in {rental?.block}. Return on time to maintain your trust score.
                    </p>
                </div>
            </div>

            {/* ─── Fixed Action Bar ─── */}
            <div className="fixed bottom-0 left-0 right-0 glass border-t border-slate-700/50 px-5 py-4 max-w-md mx-auto z-50">
                {isOwner ? (
                    <div className="space-y-3">
                        {rental?.status === "requested" ? (
                            <div className="space-y-2">
                                <p className="text-xs font-bold text-amber-400 text-center uppercase tracking-widest">
                                    Renter is waiting for approval
                                </p>
                                <button
                                    onClick={handleApprove}
                                    disabled={actionLoading}
                                    className="w-full h-14 rounded-xl gradient-indigo text-white font-black text-base shadow-indigo flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98] transition-all"
                                >
                                    {actionLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <><CheckCircle2 className="w-5 h-5" /> APPROVE RENTAL</>}
                                </button>
                            </div>
                        ) : rental?.status === "active" ? (
                            <button
                                onClick={handleMarkReturned}
                                disabled={actionLoading}
                                className="w-full h-14 rounded-xl bg-emerald-500 text-white font-black text-base flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98] transition-all"
                            >
                                {actionLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <><Package className="w-5 h-5" /> MARK AS RETURNED</>}
                            </button>
                        ) : rental?.status === "completed" ? (
                            <div className="flex flex-col items-center gap-2">
                                <div className="flex items-center gap-2 badge-trust px-4 py-2 rounded-full text-sm font-bold">
                                    <CheckCircle2 className="w-4 h-4" /> Rental Complete
                                </div>
                                <button
                                    onClick={() => setShowReportModal(true)}
                                    className="text-xs font-bold text-rose-500 underline underline-offset-4"
                                >
                                    Report an issue
                                </button>
                            </div>
                        ) : (
                            <div className="h-14 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                                <span className="text-slate-500 font-black text-sm uppercase tracking-widest">YOUR LISTING</span>
                            </div>
                        )}
                    </div>
                ) : rental?.status === "available" ? (
                    <button
                        onClick={handleRequest}
                        disabled={actionLoading}
                        className="w-full h-14 rounded-xl gradient-indigo text-white font-black text-base shadow-indigo flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98] transition-all"
                    >
                        {actionLoading ? <Loader2 className="animate-spin w-5 h-5" /> : "REQUEST NOW →"}
                    </button>
                ) : isRenter && rental?.status === "requested" ? (
                    <div className="text-center py-3">
                        <span className="badge-amber px-4 py-2 rounded-full text-sm font-bold">Awaiting owner approval...</span>
                    </div>
                ) : isRenter && rental?.status === "active" ? (
                    <div className="text-center py-3">
                        <span className="badge-indigo px-4 py-2 rounded-full text-sm font-bold">Rental is Active — return on time!</span>
                    </div>
                ) : (
                    <div className="h-14 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                        <span className="text-slate-500 font-black text-sm uppercase tracking-widest">CURRENTLY TAKEN</span>
                    </div>
                )}
            </div>

            {/* ─── Report Modal ─── */}
            {showReportModal && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center max-w-md mx-auto">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowReportModal(false)} />
                    <div className="relative w-full glass border border-slate-700 rounded-t-3xl p-6 space-y-5 z-10">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-black text-white" style={{ fontFamily: "Outfit, sans-serif" }}>Report an Issue</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Select the reason for your report</p>
                            </div>
                            <button onClick={() => setShowReportModal(false)} className="p-2 rounded-xl bg-slate-800 border border-slate-700">
                                <X className="w-4 h-4 text-slate-400" />
                            </button>
                        </div>

                        <div className="space-y-2">
                            {REPORT_REASONS.map((reason) => (
                                <button
                                    key={reason}
                                    onClick={() => setReportReason(reason)}
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${reportReason === reason
                                        ? "bg-rose-500/15 border-rose-500/40 text-rose-400"
                                        : "bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-500"
                                        }`}
                                >
                                    {reason}
                                    {reportReason === reason && <AlertTriangle className="w-4 h-4" />}
                                </button>
                            ))}
                        </div>

                        <div>
                            <textarea
                                placeholder="Additional notes (optional)..."
                                value={reportNotes}
                                onChange={(e) => setReportNotes(e.target.value)}
                                className="w-full h-20 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-rose-500/40 resize-none"
                            />
                        </div>

                        <button
                            onClick={handleReport}
                            disabled={actionLoading || !reportReason}
                            className="w-full h-12 rounded-xl bg-rose-600 text-white font-black flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-all"
                        >
                            {actionLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <><Send className="w-4 h-4" /> SUBMIT REPORT</>}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
