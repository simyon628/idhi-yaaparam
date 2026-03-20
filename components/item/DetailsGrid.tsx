"use client";
import { Info } from "lucide-react";
import { Listing } from "@/lib/types";

interface DetailsGridProps {
    item: Listing & { description?: string; collateral?: number; location?: string; views?: number };
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
    if (!value) return null;
    return (
        <div className="flex items-start justify-between py-2.5 border-b border-slate-50 last:border-0">
            <span className="text-xs text-slate-400 font-medium shrink-0 w-28">{label}</span>
            <span className="text-xs font-bold text-slate-800 text-right">{value}</span>
        </div>
    );
}

function formatDate(d: any): string {
    if (!d) return "";
    const date = d?.toDate ? d.toDate() : new Date(d);
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function DetailsGrid({ item }: DetailsGridProps) {
    const isRent = !item.listingType || item.listingType === "rent";

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Details</h2>
            <div>
                <Row label="Category" value={item.categoryId || "—"} />
                <Row label="Condition" value={item.condition} />
                <Row label="Listed for" value={
                    item.listingType === "sell" ? "Sale"
                    : item.listingType === "buy" ? "Buy"
                    : "Rent"
                } />
                <Row label="Available" value={item.status === "available" ? "Yes" : "No"} />
                <Row label="Price" value={
                    isRent
                        ? `₹${item.pricePerHour} / hr`
                        : `₹${item.pricePerHour}`
                } />
                {isRent && item.collateral && (
                    <Row label="Collateral" value={`₹${item.collateral}`} />
                )}
                {item.returnByTime && (
                    <Row label="Return by" value={new Date(item.returnByTime).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} />
                )}
                <Row label="Location" value={item.location || item.block || "Campus"} />
                <Row label="Posted on" value={formatDate(item.createdAt)} />
                <Row label="Views" value={item.views ? `${item.views} views` : undefined} />
            </div>

            {/* Collateral info box — rent items only */}
            {isRent && item.collateral && (
                <div className="mt-3 flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl p-3">
                    <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-blue-700 leading-relaxed">
                        Collateral of <strong>₹{item.collateral}</strong> is held during the rental period and returned when the item is given back in good condition.
                    </p>
                </div>
            )}
        </div>
    );
}
