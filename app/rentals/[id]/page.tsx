"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
export const dynamic = "force-dynamic";
import { db, auth } from "@/lib/firebase";
import { doc, updateDoc, addDoc, collection, serverTimestamp, onSnapshot, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { toast } from "sonner";
import { Camera, ChevronLeft, Loader2, MessageSquare, CheckCircle2, ShieldCheck, Star, IndianRupee, MapPin, Navigation, Clock, Calendar, AlertTriangle, Send, X, Package, CreditCard, Bookmark, Share2, AlarmClock, Sparkles, ThumbsUp } from "lucide-react";
import { Listing, ReportReason } from "@/lib/types";
import { useRecentItems } from "@/lib/hooks/useRecentItems";
import RentalCalculator from "@/components/rental/RentalCalculator";
import { SellerCard, TrustBadge, getTrustScore } from "@/components/item/SellerCard";
import dynamic_ from "next/dynamic";
import { CalendarCheck } from "lucide-react";
const MeetupMap = dynamic_(() => import("@/lib/map/MeetupMap"), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-slate-100 animate-pulse flex items-center justify-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Map...</div>
});


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

// --- Helper Components ---
function TimeRemaining({ expiry }: { expiry: string | Date | any }) {
    const [timeLeft, setTimeLeft] = useState<string>("");

    useEffect(() => {
        if (!expiry) return;
        const target = new Date(typeof expiry === "string" ? expiry : (expiry?.toDate ? expiry.toDate() : expiry));

        const update = () => {
            const now = new Date();
            const diff = target.getTime() - now.getTime();
            if (diff <= 0) {
                setTimeLeft("OVERDUE");
                return;
            }
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            setTimeLeft(`Return in ${hours}h ${mins}m`);
        };

        update();
        const interval = setInterval(update, 60000);
        return () => clearInterval(interval);
    }, [expiry]);

    if (!timeLeft) return null;

    return (
        <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-sm shadow-sm border ${
            timeLeft === "OVERDUE" ? "bg-rose-50 text-rose-600 border-rose-100 animate-pulse" : "bg-amber-50 text-amber-600 border-amber-100"
        }`}>
            <AlarmClock className={`w-4 h-4 ${timeLeft === "OVERDUE" ? "animate-bounce" : ""}`} />
            {timeLeft}
        </div>
    );
}

function RequesterInfo({ renterId }: { renterId: string }) {
    const [renter, setRenter] = useState<any>(null);
    useEffect(() => {
        if (!renterId || !db) return;
        getDoc(doc(db as any, "users", renterId)).then(snap => {
            if (snap.exists()) setRenter(snap.data());
        });
    }, [renterId]);

    if (!renter) return null;

    return (
        <div className="bg-amber-50/50 backdrop-blur-md rounded-2xl p-4 border border-amber-100 shadow-sm flex items-center gap-3 mb-6 animate-in slide-in-from-right duration-500">
            <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white font-black text-sm shrink-0">
                {renter.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-0.5">Borrow Request From</p>
                <p className="text-sm font-bold text-slate-800 truncate">{renter.name}</p>
                <p className="text-[10px] font-semibold text-slate-500">ID: {renter.rollNumber || "N/A"}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
                <span className="text-[8px] font-black bg-white text-emerald-600 px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-widest">Requester</span>
            </div>
        </div>
    );
}

export default function RentalDetailPage() {
    const { id } = useParams();
    const [rental, setRental] = useState<Listing | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState<ReportReason | "">("");
    const [reportNotes, setReportNotes] = useState("");
    
    const { addItem } = useRecentItems();

    // Rating State
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [rating, setRating] = useState(5);
    const [ratingComment, setRatingComment] = useState("");

    const [ownerInfo, setOwnerInfo] = useState<{ name: string, department: string, isVerified: boolean, strikeCount: number, overallRating?: number, reviewCount?: number } | null>(null);
    const [renterName, setRenterName] = useState<string>("");
    const [authChecked, setAuthChecked] = useState(false);

    const [selectedDuration, setSelectedDuration] = useState({ hours: 1, minutes: 0 });

    const handleDurationChange = (hours: number, minutes: number) => {
        setSelectedDuration(prev => {
            if (prev.hours === hours && prev.minutes === minutes) return prev;
            return { hours, minutes };
        });
    };

    const router = useRouter();
    const userId = auth?.currentUser?.uid;
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        const unsub = auth?.onAuthStateChanged(() => {
            setAuthChecked(true);
        });
        return () => unsub?.();
    }, []);

    // Check wishlist state
    useEffect(() => {
        if (!authChecked || !userId || !id || !db) return;
        getDoc(doc(db as any, `users/${userId}/saved`, id as string)).then(snap => setIsSaved(snap.exists()));
    }, [authChecked, userId, id]);

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
            toast.success("Saved to wishlist!");
        }
    };

    // Real-time listener for the rental document
    useEffect(() => {
        if (!id || !db || !authChecked) return;
        const unsub = onSnapshot(doc(db as any, "rentals", id as string), async (docSnap) => {
            if (docSnap.exists()) {
                const data = { id: docSnap.id, ...docSnap.data() } as Listing;
                setRental(data);
                addItem(data);

                // Fetch owner info
                if (data.ownerId) {
                    const ownerSnap = await getDoc(doc(db as any, "users", data.ownerId));
                    if (ownerSnap.exists()) {
                        setOwnerInfo(ownerSnap.data() as any);
                    }
                }

                // Fetch renter info if exists
                if (data.renterId) {
                    const renterSnap = await getDoc(doc(db as any, "users", data.renterId));
                    if (renterSnap.exists()) {
                        setRenterName(renterSnap.data().name);
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
        if (typeof window === "undefined" || !userId || !rental) return;
        if (rental.status !== "requested" && rental.status !== "active") return;

        // Only track if user is either owner or renter
        const isOwner = rental.ownerId === userId;
        const isRenter = rental.renterId === userId;
        if (!isOwner && !isRenter) return;

        console.log("Starting live location sync for", isOwner ? "Owner" : "Renter");

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                const fieldName = isOwner ? "ownerLocation" : "renterLocation";
                
                // Only update if location changed significantly (> 5 meters) to save Firestore writes
                // For simplicity here, we update regardless but ideally use a threshold
                updateDoc(doc(db as any, "rentals", id as string), {
                    [fieldName]: { lat: latitude, lng: longitude },
                    lastLocationUpdate: serverTimestamp()
                }).catch(err => console.error("Firestore sync error:", err));
            },
            (err) => console.warn("GPS tracking error:", err),
            { 
                enableHighAccuracy: true, 
                maximumAge: 5000, // 5 seconds cache
                timeout: 10000 
            }
        );

        return () => {
            console.log("Stopping live location sync");
            navigator.geolocation.clearWatch(watchId);
        };
    }, [rental?.status, rental?.ownerId, rental?.renterId, userId, id]);

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
        liveDistanceStr = dist < 50 ? "Very close! Look around" : `${dist}m away`;
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

    const handleRequest = async (durationStr: string) => {
        if (!userId) { 
            toast.error("Please sign in first"); 
            router.push(`/login?redirect=/rentals/${id}`);
            return; 
        }
        await updateStatus("requested", { renterId: userId, requestedAt: serverTimestamp(), requestedDuration: durationStr });

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

        toast.success("Request sent to owner!");
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
        if (!rental) return;
        const now = new Date();
        const availableUntil = rental.availableUntil || rental.expiresAt ? new Date(rental.availableUntil || rental.expiresAt!) : null;
        
        const isStillAvailable = !availableUntil || now <= availableUntil;
        
        await updateStatus(isStillAvailable ? "available" : "completed", { 
            completedAt: serverTimestamp(),
            ...(isStillAvailable ? { renterId: null } : {})
        });
        
        toast.success(isStillAvailable ? "Item returned and is available again!" : "Rental marked as complete!");
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

                {/* Share (WhatsApp) button */}
                <button
                    onClick={() => {
                        const url = `https://idhi-yaaparam.vercel.app/rentals/${id}`;
                        const msg = `Borrow my ${rental?.itemName || "item"} for ₹${rental?.pricePerHour}/hr at ${rental?.block}! → ${url}`;
                        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
                    }}
                    className="absolute top-5 right-5 p-2.5 bg-white/60 backdrop-blur-md rounded-xl border border-white/50 active:scale-95 transition-all shadow-sm"
                >
                    <Share2 className="w-5 h-5 text-slate-700" />
                </button>
            </div>

            {/* Content sheet */}
            <div className="flex-1 px-5 pt-6 -mt-4 bg-slate-50 rounded-t-3xl relative z-10 border-t border-white shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">

                {/* Product Header details */}
                <div>
                    {/* Title */}
                    <h1 className="text-2xl font-black text-slate-800 leading-tight mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>
                        {rental?.itemName}
                    </h1>

                    {/* Trust Score Row */}
                    {ownerInfo && (
                        <div className="mb-3">
                            <TrustBadge score={getTrustScore(ownerInfo.strikeCount)} large={true} />
                        </div>
                    )}

                    {/* Price */}
                     <div className="flex items-baseline gap-1.5 mb-3">
                        <span className="text-3xl font-black text-slate-900 flex items-baseline gap-0.5"><IndianRupee className="w-6 h-6" />{rental?.pricePerHour}</span><span className="text-sm text-slate-400 font-medium">/ hr</span>
                    </div>

                    {/* Location badge, Condition badge etc. */}
                    <div className="flex flex-wrap items-center gap-2 mb-6">
                        {rental?.block && (
                            <div className="flex items-center gap-1 text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
                                <MapPin className="w-3.5 h-3.5 shrink-0" />
                                <span className="text-xs font-bold uppercase tracking-wider">{rental?.block}</span>
                            </div>
                        )}
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black ${
                            rental?.condition === "Excellent" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                            rental?.condition === "Good" ? "bg-indigo-50 text-indigo-700 border border-indigo-200" :
                            rental?.condition === "Fair" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                            "bg-slate-100 text-slate-500 border border-slate-200"
                        }`}>
                            {rental?.condition === "Excellent" ? <><Sparkles className="w-3.5 h-3.5"/> Excellent</> :
                             rental?.condition === "Good" ? <><ThumbsUp className="w-3.5 h-3.5"/> Good</> :
                             rental?.condition === "Fair" ? <><AlertTriangle className="w-3.5 h-3.5"/> Fair</> : "Not stated"}
                        </div>
                    </div>
                </div>

                {/* Return Timer for Active Rentals */}
                {rental?.status === "active" && rental?.expiresAt && (
                    <div className="mb-6">
                        <TimeRemaining expiry={rental.expiresAt} />
                    </div>
                )}

                {/* Description */}
                <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 border border-white shadow-sm mb-4">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Details</p>
                    <p className="text-slate-600 text-sm leading-relaxed font-medium">
                        {rental?.itemName} available in {rental?.block}. Return on time to maintain your trust score.
                    </p>
                    {(rental?.status === "requested" || rental?.status === "active") && (
                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pickup Block</span>
                            <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                                {rental?.block || "See chat"}
                            </span>
                        </div>
                    )}
                </div>

                {/* Live Meetup Map Integration */}
                {(rental?.status === "requested" || rental?.status === "active") && (isOwner || isRenter) && (
                    <div className="mb-8 space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Meetup Tracking</h2>
                            <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Live Sync</span>
                            </div>
                        </div>
                        <div className="h-[300px] w-full rounded-[2rem] overflow-hidden shadow-lg border-2 border-white relative group">
                            <MeetupMap 
                                rental={rental} 
                                currentUserId={userId!} 
                                ownerName={ownerInfo?.name}
                                renterName={renterName}
                            />
                            <div className="absolute inset-0 bg-slate-900/10 pointer-events-none group-hover:bg-transparent transition-colors" />
                        </div>
                        {liveDistanceStr && (
                            <div className="bg-indigo-600 text-white rounded-2xl p-4 shadow-indigo flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/20 rounded-xl">
                                        <Navigation className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Meetup Distance</p>
                                        <p className="text-lg font-black">{liveDistanceStr}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => router.push(`/chat/${id}`)}
                                    className="bg-white text-indigo-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all"
                                >
                                    Chat
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Rental Cost Calculator */}
                {rental?.status === "available" && (
                    <RentalCalculator 
                        pricePerHour={rental.pricePerHour} 
                        onDurationChange={handleDurationChange}
                        onBorrow={() => handleRequest(`${selectedDuration.hours}h ${selectedDuration.minutes}m`)}
                        isBorrowLoading={actionLoading}
                    />
                )}

                {/* Owner Profile Card */}
                {ownerInfo && (
                    <div className="mb-4">
                        <SellerCard owner={{ id: rental?.ownerId!, ...ownerInfo }} />
                    </div>
                )}

                {/* Requester Detail Card (Visible to Owner if status is not available) */}
                {isOwner && rental?.renterId && (
                    <RequesterInfo renterId={rental.renterId} />
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
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => {
                                        setReportReason("Item not returned");
                                        setShowReportModal(true);
                                    }}
                                    className="h-20 rounded-2xl bg-white border-2 border-rose-50 flex flex-col items-center justify-center gap-1.5 text-rose-600 hover:border-rose-200 hover:bg-rose-50/30 transition-all shadow-sm group"
                                >
                                    <div className="p-2 bg-rose-50 rounded-xl group-hover:scale-110 transition-transform">
                                        <AlertTriangle className="w-5 h-5 fill-rose-100" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-center">Not Returned</span>
                                </button>
                                <button
                                    onClick={handleMarkReturned}
                                    disabled={actionLoading}
                                    className="h-20 rounded-2xl bg-white border-2 border-emerald-50 flex flex-col items-center justify-center gap-1.5 text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all shadow-sm group"
                                >
                                    <div className="p-2 bg-emerald-50 rounded-xl group-hover:scale-110 transition-transform">
                                        <Package className="w-5 h-5" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-center">Returned</span>
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
                        onClick={() => handleRequest(`${selectedDuration.hours}h ${selectedDuration.minutes}m`)}
                        disabled={actionLoading || (selectedDuration.hours === 0 && selectedDuration.minutes === 0)}
                        className="w-full h-14 rounded-2xl bg-indigo-600 text-white font-black text-base shadow-indigo flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 transition-all"
                    >
                        {actionLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <><CalendarCheck className="w-5 h-5" /> BORROW NOW</>}
                    </button>
                ) : isRenter && rental?.status === "requested" ? (
                    <div className="flex flex-col items-center gap-2 text-center py-2">
                        <span className="bg-amber-100 text-amber-700 border border-amber-200 px-4 py-2 rounded-full text-sm font-bold shadow-sm">Awaiting owner approval...</span>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">You will be notified</p>
                    </div>
                ) : isRenter && rental?.status === "active" ? (
                        <button
                            onClick={() => {
                                // Simulate Razorpay for now
                                toast.info("Opening Secure Payment (Simulated)...");
                                setTimeout(() => {
                                    toast.success("Payment Successful! ₹" + (rental.pricePerHour * 2) + " paid.");
                                    handleMarkReturned(); // Complete the transaction
                                }, 1500);
                            }}
                            className="w-full h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center gap-2 font-black transition-all shadow-sm active:scale-95 group"
                        >
                            <CreditCard className="w-5 h-5" />
                            <span className="text-sm uppercase tracking-widest">Pay & Return</span>
                        </button>
                ) : (
                    <div className="h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center shadow-inner">
                        <span className="text-slate-400 font-black text-sm uppercase tracking-widest text-center">ITEM ALREADY BOOKED</span>
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

            {/* ─── Duration Modal Removed ─── */}
        </div>
    );
}
