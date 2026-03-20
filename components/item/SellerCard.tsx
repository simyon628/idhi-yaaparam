"use client";
import { useRouter } from "next/navigation";
import { ShieldCheck, Shield, AlertTriangle } from "lucide-react";

interface SellerCardProps {
    owner: {
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

function BadgeByScore({ score }: { score: number }) {
    if (score >= 80) return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
            <ShieldCheck className="w-3 h-3" /> Trusted
        </span>
    );
    if (score >= 50) return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
            <Shield className="w-3 h-3" /> Moderate
        </span>
    );
    if (score >= 1) return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
            <AlertTriangle className="w-3 h-3" /> New User
        </span>
    );
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-700 border border-slate-200">
            <AlertTriangle className="w-3 h-3 text-slate-400" /> No score yet
        </span>
    );
}

function formatMemberSince(d: any): string {
    if (!d) return "";
    const date = d?.toDate ? d.toDate() : new Date(d);
    return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export function SellerCard({ owner }: SellerCardProps) {
    const router = useRouter();

    if (!owner) {
        return (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 animate-pulse">
                <div className="h-3 w-16 bg-slate-200 rounded mb-4" />
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-full bg-slate-200 shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-32 bg-slate-200 rounded" />
                        <div className="h-3 w-24 bg-slate-200 rounded" />
                    </div>
                </div>
            </div>
        );
    }

    const trustScore = owner.strikeCount === 0 ? 90 : owner.strikeCount === 1 ? 55 : owner.strikeCount === undefined ? 0 : 20;

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Seller</p>
            <div className="flex items-center gap-3 mb-4">
                {/* Avatar */}
                <div className="w-11 h-11 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-lg shrink-0 shadow-sm">
                    {owner.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-sm">{owner.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <BadgeByScore score={trustScore} />
                        {owner.department && (
                            <span className="text-[10px] text-slate-400 font-semibold">{owner.department}</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats row */}
            <div className="flex gap-3 text-center mb-4">
                {owner.itemsListedCount !== undefined && (
                    <div className="flex-1 bg-slate-50 rounded-xl py-2">
                        <p className="text-sm font-black text-slate-800">{owner.itemsListedCount}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Listed</p>
                    </div>
                )}
                {owner.reviewCount !== undefined && owner.reviewCount > 0 && (
                    <div className="flex-1 bg-slate-50 rounded-xl py-2">
                        <p className="text-sm font-black text-amber-500">{owner.overallRating?.toFixed(1)}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{owner.reviewCount} Reviews</p>
                    </div>
                )}
                {owner.createdAt && (
                    <div className="flex-1 bg-slate-50 rounded-xl py-2 px-1">
                        <p className="text-[11px] font-black text-slate-600">{formatMemberSince(owner.createdAt)}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Joined</p>
                    </div>
                )}
            </div>

            <button
                onClick={() => router.push(`/profile/${owner.id}`)}
                className="w-full py-2.5 rounded-xl border border-indigo-100 text-indigo-600 text-xs font-black uppercase tracking-widest hover:bg-indigo-50 transition-colors"
            >
                View Profile →
            </button>
        </div>
    );
}

// Owner actions card (shown when viewing your own listing)
interface OwnerActionsProps {
    itemId: string;
    onMarkSold: () => void;
    onDelete: () => void;
    loading?: boolean;
}

export function OwnerActionsCard({ itemId, onMarkSold, onDelete, loading }: OwnerActionsProps) {
    const router = useRouter();
    return (
        <div className="bg-amber-50 rounded-2xl border border-amber-100 shadow-sm p-4">
            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3">Your Listing</p>
            <div className="flex flex-col gap-2">
                <button
                    onClick={() => router.push(`/rentals/edit/${itemId}`)}
                    className="w-full py-3 rounded-xl border border-amber-200 text-amber-700 text-xs font-black uppercase tracking-widest hover:bg-amber-100 transition-colors"
                >
                    ✏️ Edit Listing
                </button>
                <button
                    onClick={onMarkSold}
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-slate-700 text-white text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                    {loading ? "Updating..." : "✓ Mark as Completed"}
                </button>
                <button
                    onClick={onDelete}
                    disabled={loading}
                    className="w-full py-3 rounded-xl text-rose-600 text-xs font-black uppercase tracking-widest hover:bg-rose-50 transition-colors border border-rose-100"
                >
                    🗑️ Delete Listing
                </button>
            </div>
        </div>
    );
}
