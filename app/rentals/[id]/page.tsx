"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
export const dynamic = "force-dynamic";
import { db, auth } from "@/lib/firebase";
import { doc, updateDoc, addDoc, collection, serverTimestamp, onSnapshot, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { toast } from "sonner";
import { Camera, ChevronLeft, Loader2, MessageSquare, CheckCircle2, ShieldCheck, Star, IndianRupee, MapPin, Navigation, Clock, Calendar, AlertTriangle, Send, X, Package, CreditCard, Bookmark, Share2, AlarmClock, Sparkles, ThumbsUp, ShoppingBag } from "lucide-react";
import { Listing, ReportReason } from "@/lib/types";
import RentalCalculator from "@/components/rental/RentalCalculator";
import { SellerCard, TrustBadge, getTrustScore } from "@/components/item/SellerCard";
import dynamic_ from "next/dynamic";
import { CalendarCheck } from "lucide-react";
import { useRazorpay } from "@/hooks/useRazorpay";



const REPORT_REASONS: ReportReason[] = [
    "Item not returned",
    "Item damaged",
    "No-show",
    "Fraud",
    "Other",
];

// Fallback mock data so cards with fake IDs (n1, t1, a1…) open a real detail view
const MOCK_ITEMS: Record<string, any> = {
  n1: { id:"n1", itemName:"Casio fx-991EX", category:"calculator", pricePerHour:15, block:"A-Block", condition:"Excellent", status:"available", listingType:"rent", icon:"🧮", photoUrl:"https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=80", ownerId:"mock", ownerInfo:{ name:"Rahul Verma", department:"CSE", rollNumber:"22CSE1001", isVerified:true, strikeCount:0, overallRating:4.8, college:"SVEC" } },
  n2: { id:"n2", itemName:"Mini Drafter", category:"drafter", pricePerHour:20, block:"B-Block", condition:"Good", status:"available", listingType:"rent", icon:"📐", photoUrl:"https://images.unsplash.com/photo-1503387837-b154d5074bd2?w=600&q=80", ownerId:"mock", ownerInfo:{ name:"Anil Kumar", department:"Mech", rollNumber:"22ME1042", isVerified:true, strikeCount:0, overallRating:4.5, college:"SVEC" } },
  n3: { id:"n3", itemName:"Lab Coat White", category:"lab-coat", pricePerHour:15, block:"Bio-Lab", condition:"Good", status:"available", listingType:"rent", icon:"🥼", photoUrl:"https://images.unsplash.com/photo-1581591524425-c7e0978865fc?w=600&q=80", ownerId:"mock", ownerInfo:{ name:"Priya Sharma", department:"Bio", rollNumber:"22BIO3021", isVerified:true, strikeCount:0, overallRating:4.7, college:"SVEC" } },
  n4: { id:"n4", itemName:"MacBook Air M1", category:"laptop", pricePerHour:100, block:"C-Block", condition:"Excellent", status:"available", listingType:"rent", icon:"💻", photoUrl:"https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80", ownerId:"mock", ownerInfo:{ name:"Sneha Reddy", department:"IT", rollNumber:"22IT2011", isVerified:true, strikeCount:0, overallRating:4.9, college:"SVEC" } },
  n5: { id:"n5", itemName:"Geometry Box", category:"geometry", pricePerHour:10, block:"D-Block", condition:"Fair", status:"available", listingType:"rent", icon:"📏", photoUrl:"https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=600&q=80", ownerId:"mock", ownerInfo:{ name:"Vikas Singh", department:"Civil", rollNumber:"22CV4055", isVerified:false, strikeCount:0, overallRating:4.2, college:"SVEC" } },
  t1: { id:"t1", itemName:"Casio fx-991EX", category:"calculator", pricePerHour:15, block:"A-Block", condition:"Excellent", status:"available", listingType:"rent", icon:"🧮", photoUrl:"https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=80", ownerId:"mock", ownerInfo:{ name:"Rahul Verma", department:"CSE", rollNumber:"22CSE1001", isVerified:true, strikeCount:0, overallRating:4.8, college:"SVEC" } },
  t2: { id:"t2", itemName:"DSLR Camera", category:"camera", pricePerHour:80, block:"Arts Block", condition:"Good", status:"available", listingType:"rent", icon:"📷", photoUrl:"https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?w=600&q=80", ownerId:"mock", ownerInfo:{ name:"Kiran Patel", department:"ECE", rollNumber:"22ECE5088", isVerified:true, strikeCount:0, overallRating:4.6, college:"SVEC" } },
  t3: { id:"t3", itemName:"Geometry Box", category:"geometry", pricePerHour:10, block:"D-Block", condition:"Fair", status:"available", listingType:"rent", icon:"📏", photoUrl:"https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=600&q=80", ownerId:"mock", ownerInfo:{ name:"Vikas Singh", department:"Civil", rollNumber:"22CV4055", isVerified:false, strikeCount:0, overallRating:4.2, college:"SVEC" } },
  a1: { id:"a1", itemName:"Engineering Drafter", category:"drafter", pricePerHour:25, block:"Mech-Lab", condition:"Good", status:"available", listingType:"rent", icon:"📐", photoUrl:"https://images.unsplash.com/photo-1503387837-b154d5074bd2?w=600&q=80", ownerId:"mock", ownerInfo:{ name:"Vikas Rao", department:"Mech", rollNumber:"22ME2033", isVerified:true, strikeCount:0, overallRating:4.3, college:"SVEC" } },
  a2: { id:"a2", itemName:"Lab Coat White L", category:"lab-coat", pricePerHour:20, block:"Bio-Lab", condition:"Good", status:"available", listingType:"rent", icon:"🥼", photoUrl:"https://images.unsplash.com/photo-1581591524425-c7e0978865fc?w=600&q=80", ownerId:"mock", ownerInfo:{ name:"Sita Devi", department:"Civil", rollNumber:"22CV1044", isVerified:true, strikeCount:0, overallRating:4.5, college:"SVEC" } },
  a3: { id:"a3", itemName:"Geometry Box Set", category:"geometry", pricePerHour:10, block:"D-Block", condition:"Fair", status:"available", listingType:"rent", icon:"📏", photoUrl:"https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=600&q=80", ownerId:"mock", ownerInfo:{ name:"Ram Kumar", department:"Mech", rollNumber:"22ME3022", isVerified:false, strikeCount:0, overallRating:4.0, college:"SVEC" } },
  c1: { id:"c1", itemName:"Scientific Calculator Casio", category:"calculator", pricePerHour:15, block:"A-Block", condition:"Excellent", status:"available", listingType:"rent", icon:"🧮", photoUrl:"https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=80", ownerId:"mock", ownerInfo:{ name:"Rahul Verma", department:"CSE", rollNumber:"22CSE1001", isVerified:true, strikeCount:0, overallRating:4.8, college:"SVEC" } },
  c2: { id:"c2", itemName:"Basic Calculator", category:"calculator", pricePerHour:5, block:"B-Block", condition:"Good", status:"available", listingType:"rent", icon:"🧮", photoUrl:"https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=600&q=80", ownerId:"mock", ownerInfo:{ name:"Priya Sharma", department:"Mech", rollNumber:"22ME1088", isVerified:false, strikeCount:0, overallRating:4.2, college:"SVEC" } },
};

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

    // Rating State
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [rating, setRating] = useState(5);
    const [ratingComment, setRatingComment] = useState("");

    const [ownerInfo, setOwnerInfo] = useState<{ name: string, department: string, isVerified: boolean, strikeCount: number, overallRating?: number, reviewCount?: number } | null>(null);
    const [renterName, setRenterName] = useState<string>("");
    const [authChecked, setAuthChecked] = useState(false);
    const lastCoordsRef = useRef<{ lat: number, lng: number } | null>(null);

    const [selectedDuration, setSelectedDuration] = useState({ hours: 1, minutes: 0 });

    const handleDurationChange = (hours: number, minutes: number) => {
        setSelectedDuration(prev => {
            if (prev.hours === hours && prev.minutes === minutes) return prev;
            return { hours, minutes };
        });
    };

    const router = useRouter();
    const { initiatePayment } = useRazorpay();
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
    // Starts immediately without waiting for auth — rental data is public
    useEffect(() => {
        if (!id || !db) return;

        // Safety timeout: never stay loading forever
        const safetyTimeout = setTimeout(() => setLoading(false), 5000);

        const unsub = onSnapshot(doc(db as any, "rentals", id as string), async (docSnap) => {
            clearTimeout(safetyTimeout);
            if (docSnap.exists()) {
                const data = { id: docSnap.id, ...docSnap.data() } as Listing;
                setRental(data);
                setLoading(false); // Stop the spinner instantly so the page loads

                try {
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
                } catch (e) {
                    console.error("Failed to fetch user profiles (likely unauthenticated):", e);
                }
            } else {
                // Try mock fallback for demo IDs like n1, t1, a1 etc.
                const mockItem = MOCK_ITEMS[id as string];
                if (mockItem) {
                    setRental(mockItem as any);
                    setOwnerInfo(mockItem.ownerInfo);
                    setLoading(false);
                } else {
                    toast.error("Rental not found");
                    router.push("/rentals");
                    setLoading(false);
                }
            }
        }, (err) => {
            clearTimeout(safetyTimeout);
            console.warn("Rental snapshot error (trying mock fallback):", err);
            // Try mock fallback for demo IDs
            const mockItem = MOCK_ITEMS[id as string];
            if (mockItem) {
                setRental(mockItem as any);
                setOwnerInfo(mockItem.ownerInfo);
            }
            setLoading(false);
        });

        return () => {
            clearTimeout(safetyTimeout);
            unsub();
        };
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
                
                if (lastCoordsRef.current) {
                    const dist = getDistanceInMeters(
                        lastCoordsRef.current.lat, lastCoordsRef.current.lng,
                        latitude, longitude
                    );
                    // Only update if moved more than 10 meters to avoid infinite update loops
                    if (dist < 10) {
                        console.log(`GPS throttle: moved only ${dist}m. Skipping Firestore push.`);
                        return;
                    }
                }
                
                lastCoordsRef.current = { lat: latitude, lng: longitude };
                const fieldName = isOwner ? "ownerLocation" : "renterLocation";
                
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
            if (MOCK_ITEMS[id as string]) {
                setRental(r => r ? { ...r, status: newStatus as any, ...extraFields } : r);
                return;
            }

            await updateDoc(doc(db, "rentals", id as string), {
                status: newStatus,
                ...extraFields,
            });
            setRental(r => r ? { ...r, status: newStatus as any, ...extraFields } : r);
        } catch (err) { 
            toast.error("Action failed. Try again."); 
            throw err;
        }
        finally { setActionLoading(false); }
    };

    const handleRequest = async (durationStr: string) => {
        if (!userId) { 
            toast.error("Please sign in first"); 
            router.push(`/login?redirect=/rentals/${id}`);
            return; 
        }
        try {
            // Check verification status
            const userDocSnap = await getDoc(doc(db as any, "users", userId));
            if (!userDocSnap.exists() || (!userDocSnap.data().isVerified && !userDocSnap.data().verified)) {
                toast.error("Please verify your student ID before renting items.");
                return;
            }

            // Optimistic navigation for perceived speed
            router.push(`/tracking/${id}`);
            toast.success("Connecting to live tracking…");

            // Fire DB updates in background without blocking navigation
            updateStatus("requested", { renterId: userId, requestedAt: serverTimestamp(), requestedDuration: durationStr }).catch(console.error);

            // Fire notification to Owner in background
            if (rental?.ownerId && rental.ownerId !== userId) {
                addDoc(collection(db as any, "notifications"), {
                    userId: rental.ownerId,
                    title: "New Rental Request",
                    message: `Someone wants to borrow your ${rental.itemName}`,
                    type: "request",
                    link: `/rentals/${id}`,
                    isRead: false,
                    createdAt: serverTimestamp()
                }).catch(console.error);
            }
        } catch (e) {
            console.error(e);
        }
    };


    const handleApprove = async () => {
        try {
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
            // Send owner straight to the tracking map
            router.push(`/tracking/${id}`);
        } catch (e) {
            console.error(e);
        }
    };

    const handleMarkReturned = async () => {
        if (!rental) return;
        const now = new Date();
        const availableUntil = rental.availableUntil || rental.expiresAt ? new Date(rental.availableUntil || rental.expiresAt!) : null;
        
        const isStillAvailable = !availableUntil || now <= availableUntil;
        
        try {
            await updateStatus(isStillAvailable ? "available" : "completed", { 
                completedAt: serverTimestamp(),
                ...(isStillAvailable ? { renterId: null } : {})
            });
            
            toast.success(isStillAvailable ? "Item returned and is available again!" : "Rental marked as complete!");
            setShowRatingModal(true);
        } catch (e) {
            console.error(e);
        }
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
    const isMock = rental?.ownerId === "mock";
    const owner = ownerInfo as any;
    const totalPrice = rental ? rental.pricePerHour * selectedDuration.hours : 0;

    return (
        <div className="flex flex-col min-h-screen pb-32 bg-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>

            {/* ── Image Gallery (horizontal scroll like Flipkart) ── */}
            <div className="relative bg-slate-100" style={{ aspectRatio: "4/3" }}>
                <div style={{ display: "flex", width: "100%", height: "100%", overflowX: "auto", scrollSnapType: "x mandatory", scrollbarWidth: "none" }}>
                    {[rental?.photoUrl, "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=80", "https://images.unsplash.com/photo-1503387837-b154d5074bd2?w=600&q=80"].filter(Boolean).map((src, i) => (
                        <img key={i} src={src} alt={rental?.itemName} style={{ width: "100%", height: "100%", objectFit: "cover", flexShrink: 0, scrollSnapAlign: "center" }} />
                    ))}
                </div>
                {/* dot indicators */}
                <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6 }}>
                    {[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: i === 0 ? "#fff" : "rgba(255,255,255,0.4)" }} />)}
                </div>
                {/* Back */}
                <button onClick={() => router.back()} style={{ position: "absolute", top: 16, left: 16, background: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)", border: "none", borderRadius: 12, padding: "8px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                    <ChevronLeft className="w-5 h-5 text-slate-700" />
                </button>
                {/* Share */}
                <button onClick={() => { const msg=`Borrow ${rental?.itemName} for ₹${rental?.pricePerHour}/hr — ${window.location.href}`; window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`,"_blank"); }} style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)", border: "none", borderRadius: 12, padding: "8px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                    <Share2 className="w-5 h-5 text-slate-700" />
                </button>
            </div>

            {/* ── Content Sheet ── */}
            <div style={{ background: "#fff", borderRadius: "24px 24px 0 0", marginTop: -20, position: "relative", zIndex: 2, padding: "20px 16px 0" }}>

                {/* Status chip */}
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, background: rental?.status === "available" ? "#DCFCE7" : "#FEF3C7", color: rental?.status === "available" ? "#16a34a" : "#b45309", borderRadius: 20, padding: "3px 10px" }}>
                        {rental?.status === "available" ? "✓ Available Now" : rental?.status === "requested" ? "⏳ Pending" : rental?.status === "active" ? "🔴 Active" : "Completed"}
                    </span>
                    {rental?.condition && (
                        <span style={{ fontSize: 11, fontWeight: 700, background: "#EEF0FF", color: "#5B4CDB", borderRadius: 20, padding: "3px 10px" }}>{rental.condition}</span>
                    )}
                </div>

                {/* Title */}
                <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: "0 0 4px", lineHeight: 1.2, fontFamily: "'Outfit', sans-serif" }}>{rental?.itemName}</h1>
                <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px" }}>{rental?.categoryId?.charAt(0).toUpperCase()}{rental?.categoryId?.slice(1)} · {rental?.block}</p>

                {/* ── Seller Info Card (Flipkart-style) ── */}
                <div style={{ background: "linear-gradient(135deg, #f8faff 0%, #eef0ff 100%)", border: "1px solid #c7d2fe", borderRadius: 16, padding: 14, marginBottom: 16 }}>
                    <p style={{ fontSize: 10, fontWeight: 800, color: "#5B4CDB", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Owner / Lender</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg, #5B4CDB, #7C3AED)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                            {owner?.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                                <span style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{owner?.name || "Unknown"}</span>
                                {owner?.isVerified && <span style={{ fontSize: 10, background: "#00C48C", color: "#fff", borderRadius: 10, padding: "1px 6px", fontWeight: 700 }}>✓ ID Verified</span>}
                            </div>
                            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                                <span style={{ fontSize: 11, color: "#64748b" }}>🎓 {owner?.department || "—"}</span>
                                <span style={{ fontSize: 11, color: "#64748b" }}>🏫 {owner?.college || "SVEC"}</span>
                                <span style={{ fontSize: 11, color: "#64748b" }}>🪪 {owner?.rollNumber || "—"}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{owner?.overallRating?.toFixed(1) || "4.5"}</span>
                                <span style={{ fontSize: 11, color: "#64748b" }}>· {owner?.reviewCount || 0} reviews</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Duration Clock Picker ── */}
                {rental?.status === "available" && !isOwner && (
                    <div style={{ background: "#f8faff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 14, marginBottom: 16 }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 10 }}>⏱ How long do you need it?</p>
                        <div style={{ display: "flex", gap: 8 }}>
                            {[
                                { label: "15 min", hours: 0, minutes: 15 },
                                { label: "1 hr", hours: 1, minutes: 0 },
                                { label: "2 hrs", hours: 2, minutes: 0 },
                                { label: "4 hrs", hours: 4, minutes: 0 },
                                { label: "1 Day", hours: 24, minutes: 0 },
                            ].map(opt => {
                                const isSelected = selectedDuration.hours === opt.hours && selectedDuration.minutes === opt.minutes;
                                return (
                                    <button key={opt.label} onClick={() => setSelectedDuration({ hours: opt.hours, minutes: opt.minutes })} style={{ flex: 1, padding: "8px 0", borderRadius: 10, border: isSelected ? "2px solid #5B4CDB" : "1px solid #e2e8f0", background: isSelected ? "#EEF0FF" : "#fff", color: isSelected ? "#5B4CDB" : "#475569", fontWeight: 700, fontSize: 11, cursor: "pointer", transition: "all 0.15s" }}>
                                        {opt.label}
                                    </button>
                                );
                            })}
                        </div>
                        {/* Live price preview */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 10, borderTop: "1px solid #e2e8f0" }}>
                            <span style={{ fontSize: 12, color: "#64748b" }}>₹{rental.pricePerHour}/hr × {selectedDuration.hours > 0 ? `${selectedDuration.hours}h` : ""}{selectedDuration.minutes > 0 ? ` ${selectedDuration.minutes}m` : ""}</span>
                            <span style={{ fontSize: 18, fontWeight: 800, color: "#5B4CDB" }}>
                                ₹{selectedDuration.minutes === 15 ? Math.round(rental.pricePerHour * 0.25) : rental.pricePerHour * selectedDuration.hours}
                            </span>
                        </div>
                    </div>
                )}

                {/* Active rental timer */}
                {rental?.status === "active" && rental?.expiresAt && (
                    <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 16, padding: 14, marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
                        <AlarmClock className="w-5 h-5 text-orange-500" />
                        <div>
                            <p style={{ fontSize: 11, color: "#92400e", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Return Timer</p>
                            <TimeRemaining expiry={rental.expiresAt} />
                        </div>
                    </div>
                )}



                {/* Location & pickup info */}
                <div style={{ background: "#f8faff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 14, marginBottom: 16 }}>
                    <p style={{ fontSize: 10, fontWeight: 800, color: "#5B4CDB", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Pickup Location</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <MapPin className="w-4 h-4 text-indigo-500" />
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>{rental?.block || "Campus Block"}</span>
                    </div>
                    <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Meet at the pickup block. Confirm with owner via chat after approval.</p>
                </div>

                {/* Owner's pending requester info */}
                {isOwner && rental?.renterId && (
                    <RequesterInfo renterId={rental.renterId} />
                )}
            </div>

            {/* ── Fixed Bottom Bar (like Amazon/Flipkart) ── */}
            <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid #e2e8f0", padding: "12px 16px 20px", zIndex: 50, maxWidth: 480, margin: "0 auto" }}>
                {isOwner ? (
                    <>
                        {rental?.status === "requested" && (
                            <button onClick={handleApprove} disabled={actionLoading} style={{ width: "100%", height: 52, background: "#5B4CDB", color: "#fff", border: "none", borderRadius: 14, fontSize: 15, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                                {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> Approve Rental</>}
                            </button>
                        )}
                        {rental?.status === "active" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                    <button onClick={() => router.push(`/tracking/${id}`)} style={{ height: 52, background: "#EEF2FF", color: "#4F46E5", border: "1px solid #C7D2FE", borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>📍 Live Tracking</button>
                                    <button onClick={handleMarkReturned} disabled={actionLoading} style={{ height: 52, background: "#F0FDF4", color: "#16A34A", border: "1px solid #BBF7D0", borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{actionLoading ? "..." : "✓ Mark Returned"}</button>
                                </div>
                                <button onClick={() => { setReportReason("Item not returned"); setShowReportModal(true); }} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 11, fontWeight: 600, textDecoration: "underline", cursor: "pointer" }}>Report issue (Not returned)</button>
                            </div>
                        )}
                        {rental?.status === "available" && (
                            <div style={{ height: 52, background: "#f1f5f9", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontWeight: 700, fontSize: 13 }}>YOUR LISTING</div>
                        )}
                        {rental?.status === "completed" && (
                            <button onClick={() => setShowRatingModal(true)} style={{ width: "100%", height: 52, background: "#FFF7ED", color: "#D97706", border: "1px solid #FDE68A", borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>⭐ Rate This Transaction</button>
                        )}
                    </>
                ) : rental?.status === "available" ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div>
                            <p style={{ fontSize: 10, color: "#94a3b8", margin: 0, fontWeight: 600 }}>Total</p>
                            <p style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                                ₹{selectedDuration.minutes === 15 ? Math.round((rental?.pricePerHour || 0) * 0.25) : (rental?.pricePerHour || 0) * selectedDuration.hours}
                            </p>
                        </div>
                        <button
                            onClick={() => handleRequest(selectedDuration.hours === 0 ? `${selectedDuration.minutes}m` : `${selectedDuration.hours}h`)}
                            disabled={actionLoading}
                            style={{ flex: 1, height: 52, background: "linear-gradient(135deg, #5B4CDB, #7C3AED)", color: "#fff", border: "none", borderRadius: 14, fontSize: 15, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                        >
                            {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ShoppingBag className="w-5 h-5" /> Borrow Now</>}
                        </button>
                    </div>
                ) : isRenter && rental?.status === "requested" ? (
                    <div style={{ textAlign: "center", padding: "8px 0" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#D97706", background: "#FEF3C7", borderRadius: 20, padding: "8px 20px" }}>⏳ Awaiting owner approval…</span>
                    </div>
                ) : isRenter && rental?.status === "active" ? (
                    <button onClick={() => { 
                        if (!rental?.pricePerHour || !rental?.requestedDuration) {
                            handleMarkReturned();
                            return;
                        }
                        const durationStr = rental.requestedDuration;
                        const duration = durationStr.includes('h') ? parseInt(durationStr) : 0.25;
                        const amount = rental.pricePerHour * duration;
                        initiatePayment({ 
                            amount, 
                            entityId: id as string, 
                            entityType: 'rental', 
                            onSuccess: () => handleMarkReturned() 
                        });
                    }} style={{ width: "100%", height: 52, background: "#16A34A", color: "#fff", border: "none", borderRadius: 14, fontSize: 15, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        <CreditCard className="w-5 h-5" /> Pay & Return
                    </button>
                ) : (
                    <div style={{ height: 52, background: "#f1f5f9", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontWeight: 700, fontSize: 13 }}>ITEM ALREADY BOOKED</div>
                )}
            </div>

            {/* ── Report Modal ── */}
            {showReportModal && (
                <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "flex-end" }}>
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} onClick={() => setShowReportModal(false)} />
                    <div style={{ position: "relative", width: "100%", background: "#fff", borderRadius: "24px 24px 0 0", padding: 24, zIndex: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                            <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Report an Issue</h3>
                            <button onClick={() => setShowReportModal(false)} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, padding: "6px 8px", cursor: "pointer" }}><X className="w-4 h-4" /></button>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                            {REPORT_REASONS.map(r => (
                                <button key={r} onClick={() => setReportReason(r)} style={{ padding: "12px 16px", borderRadius: 12, border: reportReason === r ? "2px solid #DC2626" : "1px solid #e2e8f0", background: reportReason === r ? "#FEF2F2" : "#fff", color: reportReason === r ? "#DC2626" : "#334155", fontWeight: 600, fontSize: 14, textAlign: "left", cursor: "pointer" }}>{r}</button>
                            ))}
                        </div>
                        <textarea placeholder="Additional notes…" value={reportNotes} onChange={e => setReportNotes(e.target.value)} style={{ width: "100%", height: 80, borderRadius: 12, border: "1px solid #e2e8f0", padding: "10px 14px", fontSize: 13, resize: "none", marginBottom: 16, boxSizing: "border-box" }} />
                        <button onClick={handleReport} disabled={actionLoading || !reportReason} style={{ width: "100%", height: 52, background: "#DC2626", color: "#fff", border: "none", borderRadius: 12, fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
                            {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Report"}
                        </button>
                    </div>
                </div>
            )}

            {/* ── Rating Modal ── */}
            {showRatingModal && (
                <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "flex-end" }}>
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} onClick={() => setShowRatingModal(false)} />
                    <div style={{ position: "relative", width: "100%", background: "#fff", borderRadius: "24px 24px 0 0", padding: 24, zIndex: 10 }}>
                        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Rate Transaction</h3>
                        <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>How was your experience?</p>
                        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 16 }}>
                            {[1,2,3,4,5].map(star => (
                                <button key={star} onClick={() => setRating(star)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 36 }}>
                                    {star <= rating ? "⭐" : "☆"}
                                </button>
                            ))}
                        </div>
                        <textarea placeholder="Write a short review (optional)…" value={ratingComment} onChange={e => setRatingComment(e.target.value)} style={{ width: "100%", height: 80, borderRadius: 12, border: "1px solid #e2e8f0", padding: "10px 14px", fontSize: 13, resize: "none", marginBottom: 16, boxSizing: "border-box" }} />
                        <button onClick={handleRateUser} disabled={actionLoading} style={{ width: "100%", height: 52, background: "#5B4CDB", color: "#fff", border: "none", borderRadius: 12, fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
                            {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Review"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
