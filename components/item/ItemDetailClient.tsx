"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, setDoc, deleteDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";
import { ChevronLeft, Share2, Heart, IndianRupee, MapPin, Clock } from "lucide-react";
import { Listing } from "@/lib/types";

import { PhotoCarousel } from "./PhotoCarousel";
import { SellerCard, OwnerActionsCard, TrustBadge, getTrustScore } from "./SellerCard";
import { DetailsGrid } from "./DetailsGrid";
import { ActionBar } from "./ActionBar";
import { SimilarItems } from "./SimilarItems";
import { SafetyTips } from "./SafetyTips";

// ── timeAgo helper ──────────────────────────────────────────────────────────
function timeAgo(date: any): string {
    const d = date?.toDate ? date.toDate() : new Date(date);
    const diff = Date.now() - d.getTime();
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} hours ago`;
    if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)} days ago`;
    return d.toLocaleDateString("en-IN");
}

interface ItemDetailClientProps {
    item: Listing & { description?: string; collateral?: number; location?: string; views?: number; photos?: string[] };
    isOwner: boolean;
    currentUserId: string | null;
    ownerData: {
        id: string;
        name: string;
        department?: string;
        isVerified?: boolean;
        overallRating?: number;
        reviewCount?: number;
        strikeCount?: number;
        createdAt?: any;
        itemsListedCount?: number;
    } | null;
}

// Badge components
function StatusBadge({ status }: { status: string }) {
    const cfg: Record<string, { label: string; cls: string }> = {
        available: { label: "Available", cls: "bg-emerald-50 text-emerald-700 border-emerald-100" },
        requested: { label: "Requested", cls: "bg-amber-50 text-amber-700 border-amber-100" },
        active:    { label: "Borrowed", cls: "bg-indigo-50 text-indigo-700 border-indigo-100" },
        completed: { label: "Returned", cls: "bg-slate-100 text-slate-600 border-slate-200" },
        cancelled: { label: "Cancelled", cls: "bg-rose-50 text-rose-700 border-rose-100" },
    };
    const c = cfg[status] || cfg.available;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${c.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status === "available" ? "bg-emerald-500" : status === "active" ? "bg-amber-500" : "bg-slate-400"}`} />
            {c.label}
        </span>
    );
}

function TypeBadge({ type }: { type?: string }) {
    if (!type || type === "rent") return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-teal-50 text-teal-700 border-teal-100">For Rent</span>;
    if (type === "sell") return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-purple-50 text-purple-700 border-purple-100">For Sale</span>;
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-100">Free</span>;
}

function ConditionBadge({ condition }: { condition?: string }) {
    if (!condition) return null;
    const cls = condition === "Excellent" ? "bg-blue-50 text-blue-700 border-blue-100"
        : condition === "Good" ? "bg-emerald-50 text-emerald-700 border-emerald-100"
        : condition === "Fair" ? "bg-amber-50 text-amber-700 border-amber-100"
        : "bg-slate-100 text-slate-600 border-slate-200";
    return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${cls}`}>{condition}</span>;
}

// Description with Read more / less
function Description({ text }: { text?: string }) {
    const [expanded, setExpanded] = useState(false);
    if (!text) return <p className="text-sm text-slate-400 italic leading-relaxed">No description provided.</p>;
    const isLong = text.length > 150;
    return (
        <div>
            <p className="text-sm text-slate-600 leading-[1.7]">
                {isLong && !expanded ? text.slice(0, 150) + "…" : text}
            </p>
            {isLong && (
                <button onClick={() => setExpanded(e => !e)} className="text-xs font-bold text-indigo-500 mt-1 hover:underline">
                    {expanded ? "Show less" : "Read more"}
                </button>
            )}
        </div>
    );
}

export function ItemDetailClient({ item, ownerData }: Omit<ItemDetailClientProps, "isOwner" | "currentUserId">) {
    const router = useRouter();
    const [isSaved, setIsSaved] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [ownerActionLoading, setOwnerActionLoading] = useState(false);

    // Resolve auth state on client
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [authReady, setAuthReady] = useState(false);

    useEffect(() => {
        if (!auth) { setAuthReady(true); return; }
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setCurrentUserId(user ? user.uid : null);
            setAuthReady(true);
        });
        return () => unsubscribe();
    }, []);

    const isOwner = authReady && currentUserId === item.ownerId;

    // Check saved status
    useEffect(() => {
        if (!currentUserId || !db) return;
        getDoc(doc(db!, `users/${currentUserId}/saved`, item.id)).then(snap => setIsSaved(snap.exists()));
    }, [currentUserId, item.id]);

    const hasViewed = useRef(false);

    useEffect(() => {
        if (hasViewed.current) return;
        hasViewed.current = true;
        
        if (db) {
            updateDoc(doc(db, "rentals", item.id), {
                views: ((item.views || 0) + 1)
            }).catch(() => null);
        }
        
        // Note: The requested Supabase snippet was provided in the prompt,
        // but since this project runs on Firebase, the logic above achieves 
        // the equivalent database update.
        /*
        supabase.from('items')
            .update({ views: (item.views ?? 0) + 1 })
            .eq('id', item.id)
        */
    }, [item.id, item.views]);

    // Scroll detection for sticky header
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 100);
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const toggleSave = async () => {
        if (!currentUserId || !db) { toast.error("Sign in to save items"); return; }
        const ref = doc(db!, `users/${currentUserId}/saved`, item.id);
        if (isSaved) {
            await deleteDoc(ref);
            setIsSaved(false);
            toast.success("Removed from saved");
        } else {
            await setDoc(ref, { savedAt: serverTimestamp() });
            setIsSaved(true);
            toast.success("Saved! 🔖");
        }
    };

    const handleShare = async () => {
        const url = `${typeof window !== "undefined" ? window.location.origin : ""}/rentals/${item.id}`;
        if (navigator.share) {
            await navigator.share({ title: item.itemName, url });
        } else {
            await navigator.clipboard.writeText(url);
            toast.success("Link copied!");
        }
    };

    const handleMarkSold = async () => {
        if (!confirm("Mark this listing as completed?")) return;
        setOwnerActionLoading(true);
        try {
            await updateDoc(doc(db!, "rentals", item.id), { status: "completed" });
            toast.success("Listing marked as completed.");
            router.push("/rentals");
        } catch {
            toast.error("Could not update.");
        } finally {
            setOwnerActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Delete this listing? This cannot be undone.")) return;
        setOwnerActionLoading(true);
        try {
            await updateDoc(doc(db!, "rentals", item.id), { status: "cancelled" });
            toast.success("Listing deleted.");
            router.back();
        } catch {
            toast.error("Could not delete.");
        } finally {
            setOwnerActionLoading(false);
        }
    };

    const photos: string[] = (item as any).photos?.length ? (item as any).photos : item.photoUrl ? [item.photoUrl] : [];
    const isRent = !item.listingType || item.listingType === "rent";

    return (
        <div className="min-h-screen bg-white pb-24">
            {/* Sticky Top Header */}
            <header className={`sticky top-0 z-50 h-[52px] flex items-center justify-between px-4 transition-all duration-200 ${scrolled ? "bg-white/90 backdrop-blur-xl shadow-sm border-b border-slate-100" : "bg-transparent"}`}>
                <button
                    onClick={() => router.back()}
                    className="p-2 rounded-full bg-white/80 backdrop-blur-sm border border-slate-100 shadow-sm active:scale-95 transition-all -ml-1"
                >
                    <ChevronLeft className="w-5 h-5 text-slate-700" />
                </button>

                {/* Title on scroll */}
                <p className={`flex-1 mx-3 text-sm font-bold text-slate-800 truncate transition-opacity duration-200 ${scrolled ? "opacity-100" : "opacity-0"}`}>
                    {item.itemName}
                </p>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleShare}
                        className="p-2 rounded-full bg-white/80 backdrop-blur-sm border border-slate-100 shadow-sm active:scale-95 transition-all"
                    >
                        <Share2 className="w-4 h-4 text-slate-600" />
                    </button>
                    <button
                        onClick={toggleSave}
                        className={`p-2 rounded-full bg-white/80 backdrop-blur-sm border shadow-sm active:scale-95 transition-all ${isSaved ? "border-rose-200 text-rose-500" : "border-slate-100 text-slate-600"}`}
                    >
                        <Heart className={`w-4 h-4 ${isSaved ? "fill-rose-500 text-rose-500" : ""}`} />
                    </button>
                </div>
            </header>

            {/* Pull header back from below carousel */}
            <div className="relative -mt-[52px]">
                {/* Photo Carousel */}
                <PhotoCarousel photos={photos} itemName={item.itemName} />
            </div>

            {/* Content area */}
            <div className="px-4 pt-4 flex flex-col gap-5">

                {/* Price + Title + Badges */}
                {/* Product Header details */}
                <div>
                    {/* Title */}
                    <h1 className="text-2xl font-black text-slate-800 leading-snug mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>
                        {item.itemName}
                    </h1>

                    {/* Trust Score Row */}
                    {ownerData !== null && ownerData !== undefined && (
                        <div className="mb-3">
                            <TrustBadge score={getTrustScore(ownerData.strikeCount)} large={true} />
                        </div>
                    )}

                    {/* Price */}
                    <div className="flex items-baseline gap-1.5 mb-3">
                        {isRent ? (
                            <><span className="text-3xl font-black text-slate-900 flex items-baseline gap-0.5"><IndianRupee className="w-6 h-6" />{item.pricePerHour}</span><span className="text-sm text-slate-400 font-medium">per hour</span></>
                        ) : (item as any).listingType === "free" ? (
                            <span className="text-3xl font-black text-emerald-600">FREE</span>
                        ) : (
                            <><span className="text-3xl font-black text-slate-900 flex items-baseline gap-0.5"><IndianRupee className="w-6 h-6" />{item.pricePerHour}</span></>
                        )}
                    </div>

                    {/* Badges row: Location, Type, Condition, Status, etc */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                        {item.block && (
                            <div className="flex items-center gap-1 text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                                <MapPin className="w-3 h-3 shrink-0" />
                                <span className="text-[10px] font-bold">{item.block}</span>
                            </div>
                        )}
                        <TypeBadge type={item.listingType} />
                        <ConditionBadge condition={item.condition} />
                        <StatusBadge status={item.status} />
                        {item.categoryId && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-slate-50 text-slate-600 border-slate-200">{item.categoryId}</span>
                        )}
                    </div>

                    {/* Time posted + views */}
                    <div className="flex flex-col gap-1 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(item.createdAt)}</span>
                        <span>{item.views ?? 0} views</span>
                    </div>
                </div>

                {/* Seller Card */}
                {isOwner ? (
                    <OwnerActionsCard
                        itemId={item.id}
                        onMarkSold={handleMarkSold}
                        onDelete={handleDelete}
                        loading={ownerActionLoading}
                    />
                ) : ownerData ? (
                    <SellerCard owner={ownerData} />
                ) : null}

                {/* Details Grid */}
                <DetailsGrid item={item as any} />

                {/* Description */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">About this item</h2>
                    <Description text={(item as any).description} />
                </div>

                {/* Safety Tips */}
                <SafetyTips />

                {/* Similar Items */}
                <SimilarItems
                    currentItemId={item.id}
                    categoryId={item.categoryId}
                    collegeId={item.collegeId}
                />
            </div>

            {/* Fixed Action Bar */}
            <ActionBar
                item={item}
                isOwner={isOwner}
                currentUserId={currentUserId}
                isSaved={isSaved}
                onToggleSave={toggleSave}
                onMarkSold={handleMarkSold}
                ownerActionLoading={ownerActionLoading}
            />
        </div>
    );
}
