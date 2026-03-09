"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
export const dynamic = "force-dynamic";
import { db, auth } from "@/lib/firebase";
import { doc, updateDoc, addDoc, collection, serverTimestamp, onSnapshot, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { toast } from "sonner";
import {
    ChevronLeft, MapPin, Clock, IndianRupee, ShieldCheck,
    Loader2, CheckCircle2, Package, AlertTriangle, X, Send, Navigation, MessageSquare, Star, Bookmark
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

    // Rating State
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [rating, setRating] = useState(5);
    const [ratingComment, setRatingComment] = useState("");

    const [ownerInfo, setOwnerInfo] = useState<{ name: string, department: string, isVerified: boolean, strikeCount: number, overallRating?: number, reviewCount?: number } | null>(null);

    const router = useRouter();
    const userId = auth?.currentUser?.uid;
    const [isSaved, setIsSaved] = useState(false);

    // Check wishlist state
    useEffect(() => {
        if (!userId || !id || !db) return;
        getDoc(doc(db as any, `users/${userId}/saved`, id as string)).then(snap => setIsSaved(snap.exists()));
    }, [userId, id]);

    const toggleSave = async () => {
        if (!userId || !id || !db) { toast.error("Sign in to save items"); return; }
        const ref = doc(db as any, `users/${userId}/saved`, id as string);
        if (isSaved) {
            await deleteDoc(ref);
            setIsSaved(false);
            toast.success("Removed from wishlist");
        } else {
            await setDoc(ref, { savedAt: serverTimestamp() });
            setIsSaved(true);
            toast.success("Saved to wishlist! 🔖");
        }
    };

    // Real-time listener for the rental document
    useEffect(() => {
        if (!id || !db) return;
        const unsub = onSnapshot(doc(db as any, "rentals", id as string), async (docSnap) => {
            if (docSnap.exists()) {
                const data = { id: docSnap.id, ...docSnap.data() } as Listing;
                setRental(data);

                // Fetch owner info
                if (data.ownerId) {
                    const ownerSnap = await getDoc(doc(db as any, "users", data.ownerId));
                    if (ownerSnap.exists()) {
                        setOwnerInfo(ownerSnap.data() as any);
                    }
                }
            } else {
                toast.error("Rental not found");
                router.push("/rentals");
            }
            setLoading(false);
        }, (err) => {
            toast.error("Error connecting to live update");
            setLoading(false);
        });
        return () => unsub();
    }, [id, router]);

    // Live GPS tracking when active or requested
    useEffect(() => {
        // SIMPLIFIED SCOPE: Parking live tracking for now to ensure stable core logic.
        /*
        if (!process.browser || !userId || !rental) return;
        if (rental.status !== "requested" && rental.status !== "active") return;

        const isOwner = rental.ownerId === userId;
        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                const fieldName = isOwner ? "ownerLocation" : "renterLocation";
                updateDoc(doc(db as any, "rentals", id as string), {
                    [fieldName]: { lat: latitude, lng: longitude }
                }).catch(console.error);
            },
            (err) => console.warn("GPS tracking error:", err),
            { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
        */
    }, [rental?.status, rental?.ownerId, userId, id]);

    // Haversine distance calculator (meters)
    const getDistanceInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371e3;
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.floor(R * c);
    };

    let liveDistanceStr = "";
    if (rental && rental.ownerLocation && rental.renterLocation) {
        const dist = getDistanceInMeters(rental.ownerLocation.lat, rental.ownerLocation.lng, rental.renterLocation.lat, rental.renterLocation.lng);
        liveDistanceStr = dist < 50 ? "Very close! Look around 👀" : `${dist}m away`;
    }

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

        // Fire notification to Owner
        if (rental?.ownerId && rental.ownerId !== userId) {
            await addDoc(collection(db as any, "notifications"), {
                userId: rental.ownerId,
                title: "New Rental Request",
                message: `Someone wants to borrow your ${rental.itemName}`,
                type: "request",
                link: `/rentals/${id}`,
                isRead: false,
                createdAt: serverTimestamp()
            });
        }

        toast.success("Request sent to owner! 🎉");
    };

    const handleApprove = async () => {
        await updateStatus("active", { approvedAt: serverTimestamp() });

        // Fire notification to Renter
        if (rental?.renterId) {
            await addDoc(collection(db as any, "notifications"), {
                userId: rental.renterId,
                title: "Rental Approved!",
                message: `You can now pick up the ${rental.itemName}. Check your chat for details!`,
                type: "approval",
                link: `/chat/${id}`,
                isRead: false,
                createdAt: serverTimestamp()
            });
        }

        toast.success("Rental approved!");
    };

    const handleMarkReturned = async () => {
        await updateStatus("completed", { completedAt: serverTimestamp() });
        toast.success("Rental marked as complete!");
        setShowRatingModal(true);
    };

    const handleRateUser = async () => {
        if (!db || !userId || !rental) return;
        setActionLoading(true);

        const targetUserId = rental.ownerId === userId ? rental.renterId : rental.ownerId;
        if (!targetUserId) return;

        try {
            // Write Review
            await addDoc(collection(db as any, "reviews"), {
                rentalId: id,
                reviewerId: userId,
                reviewedUserId: targetUserId,
                rating,
                comment: ratingComment,
                createdAt: serverTimestamp()
            });

            // Update user aggregates
            const userRef = doc(db as any, "users", targetUserId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const currentRating = userSnap.data().overallRating || 0;
                const currentCount = userSnap.data().reviewCount || 0;
                const newCount = currentCount + 1;
                const newRating = ((currentRating * currentCount) + rating) / newCount;

                await updateDoc(userRef, {
                    overallRating: newRating,
                    reviewCount: newCount
                });
            }

            toast.success("Thanks for your review!");
            setShowRatingModal(false);
        } catch {
            toast.error("Failed to submit review");
        } finally {
            setActionLoading(false);
        }
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
                const renterRef = doc(db as any, "users", rental.renterId);
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

                {/* Description & Distance Tracking */}
                <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 border border-white shadow-sm mb-8">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Details</p>
                    <p className="text-slate-600 text-sm leading-relaxed font-medium">
                        Top condition {rental?.itemName} available in {rental?.block}. Return on time to maintain your trust score.
                    </p>

                    {(rental?.status === "requested" || rental?.status === "active") && (
                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-indigo-600">
                                <Navigation className="w-4 h-4 animate-pulse" />
                                <span className="text-xs font-bold uppercase tracking-widest">Live Distance</span>
                            </div>
                            <span className="text-sm font-black text-slate-800 bg-indigo-50 px-3 py-1 rounded-full">
                                {liveDistanceStr || "Tracing radar..."}
                            </span>
                        </div>
                    )}
                </div>

                {/* Owner Profile Card */}
                {ownerInfo && (
                    <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 border border-indigo-50 shadow-sm flex items-center justify-between group cursor-pointer hover:border-indigo-100 transition-all mb-8">
                        <div className="flex items-center gap-3 relative">
                            <div className="w-12 h-12 rounded-full gradient-indigo flex items-center justify-center text-white font-black text-lg shadow-indigo shrink-0">
                                {ownerInfo.name.charAt(0).toUpperCase()}
                            </div>
                            {ownerInfo.strikeCount === 0 && ownerInfo.isVerified && (
                                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 border-2 border-white shadow-sm">
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                </div>
                            )}
                            <div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-0.5">Listed By</p>
                                <p className="text-[15px] font-bold text-slate-800 leading-tight flex items-center gap-1.5">
                                    {ownerInfo.name}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <p className="text-xs font-semibold text-indigo-500">{ownerInfo.department}</p>
                                    {ownerInfo.reviewCount && ownerInfo.reviewCount > 0 ? (
                                        <div className="flex items-center gap-0.5 text-xs font-bold text-amber-500 bg-amber-50 border border-amber-100 px-1.5 py-[1px] rounded">
                                            <Star className="w-3 h-3 fill-amber-500" />
                                            {ownerInfo.overallRating?.toFixed(1)} <span className="text-amber-600/60 font-medium">({ownerInfo.reviewCount})</span>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
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
                            <div className="flex gap-2">
                                <button
                                    onClick={() => router.push(`/chat/${id}`)}
                                    className="h-14 w-14 shrink-0 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 hover:bg-indigo-100 transition-colors shadow-sm"
                                >
                                    <MessageSquare className="w-5 h-5 fill-indigo-100" />
                                </button>
                                <button
                                    onClick={handleMarkReturned}
                                    disabled={actionLoading}
                                    className="flex-1 h-14 rounded-2xl bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 disabled:opacity-60 active:scale-[0.98] transition-all hover:bg-emerald-600 shadow-sm"
                                >
                                    {actionLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <><Package className="w-4 h-4" /> CONFIRM RETURN</>}
                                </button>
                            </div>
                        ) : rental?.status === "completed" ? (
                            <div className="flex flex-col items-center gap-2">
                                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 border border-emerald-100 px-4 py-2 rounded-full text-sm font-bold shadow-sm">
                                    <CheckCircle2 className="w-4 h-4" /> Rental Complete
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setShowRatingModal(true)}
                                        className="text-xs font-bold text-amber-500 hover:text-amber-600 flex items-center gap-1"
                                    >
                                        <Star className="w-3 h-3 fill-amber-500" /> Rate Transaction
                                    </button>
                                    <span className="text-slate-300">|</span>
                                    <button
                                        onClick={() => setShowReportModal(true)}
                                        className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors"
                                    >
                                        Report an issue
                                    </button>
                                </div>
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
                        {actionLoading ? <Loader2 className="animate-spin w-5 h-5" /> : "BORROW NOW →"}
                    </button>
                ) : isRenter && rental?.status === "requested" ? (
                    <div className="flex flex-col items-center gap-2 text-center py-2">
                        <span className="bg-amber-100 text-amber-700 border border-amber-200 px-4 py-2 rounded-full text-sm font-bold shadow-sm">Awaiting owner approval...</span>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">You will be notified</p>
                    </div>
                ) : isRenter && rental?.status === "active" ? (
                    <button
                        onClick={() => router.push(`/chat/${id}`)}
                        className="w-full h-14 rounded-2xl bg-indigo-600 text-white font-black text-base shadow-indigo flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:-translate-y-0.5"
                    >
                        <MessageSquare className="w-5 h-5" /> OPEN CHAT
                    </button>
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

            {/* ─── Rating Modal ─── */}
            {showRatingModal && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center max-w-md mx-auto">
                    <div className="absolute inset-0 bg-slate-800/40 backdrop-blur-sm" onClick={() => setShowRatingModal(false)} />
                    <div className="relative w-full bg-slate-50 border-t border-indigo-100 rounded-t-[2rem] p-6 space-y-5 z-10 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-black text-slate-800" style={{ fontFamily: "Outfit, sans-serif" }}>Rate Transaction</h3>
                                <p className="text-xs text-slate-500 mt-0.5 font-medium">How was your experience?</p>
                            </div>
                            <button onClick={() => setShowRatingModal(false)} className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm">
                                <X className="w-4 h-4 text-slate-400" />
                            </button>
                        </div>

                        <div className="flex justify-center gap-2 py-4">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => setRating(star)}
                                    className="p-1 active:scale-90 transition-transform"
                                >
                                    <Star className={`w-10 h-10 ${star <= rating ? "fill-amber-400 text-amber-400" : "fill-slate-100 text-slate-200"}`} />
                                </button>
                            ))}
                        </div>

                        <div>
                            <textarea
                                placeholder="Write a short review (optional)..."
                                value={ratingComment}
                                onChange={(e) => setRatingComment(e.target.value)}
                                className="w-full h-24 bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 resize-none shadow-inner transition-all"
                            />
                        </div>

                        <button
                            onClick={handleRateUser}
                            disabled={actionLoading}
                            className="w-full h-14 rounded-2xl bg-indigo-600 text-white font-black flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-all hover:bg-indigo-700 shadow-sm"
                        >
                            {actionLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <><Star className="w-4 h-4 fill-white" /> SUBMIT REVIEW</>}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
