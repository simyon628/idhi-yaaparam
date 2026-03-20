"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { Listing } from "@/lib/types";
import { IndianRupee } from "lucide-react";

interface SimilarItemsProps {
    currentItemId: string;
    categoryId?: string;
    collegeId?: string;
}

function SimilarCard({ item }: { item: Listing }) {
    const router = useRouter();
    const [imgLoaded, setImgLoaded] = useState(false);

    // Card: 140px wide, 190px tall. Photo top 55% = 104.5px
    return (
        <button
            onClick={() => router.push(`/item/${item.id}`)}
            className="shrink-0 w-[140px] h-[190px] rounded-xl bg-white border border-slate-100 shadow-sm overflow-hidden flex flex-col text-left active:scale-[0.97] transition-transform group"
        >
            <div className="w-full h-[104.5px] bg-slate-50 overflow-hidden relative shrink-0">
                {!imgLoaded && <div className="absolute inset-0 bg-slate-100 animate-pulse" />}
                {item.photoUrl ? (
                    <img
                        src={item.photoUrl}
                        alt={item.itemName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onLoad={() => setImgLoaded(true)}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl bg-slate-50">
                        {item.icon || "📦"}
                    </div>
                )}
            </div>
            
            <div className="p-2 flex flex-col justify-between flex-1 min-w-0">
                <div className="space-y-0.5">
                    {/* title (1 line truncated) */}
                    <p className="text-[11px] font-bold text-slate-800 truncate leading-tight uppercase tracking-tight">{item.itemName}</p>
                    {/* price */}
                    <div className="flex items-center gap-0.5 text-slate-900">
                        <IndianRupee className="w-2.5 h-2.5" />
                        <span className="text-xs font-black">{item.pricePerHour}</span>
                        {item.listingType === "rent" && <span className="text-[8px] text-slate-400 font-bold">/hr</span>}
                    </div>
                </div>
                
                {/* listing_type badge */}
                <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md w-fit border ${
                    item.listingType === "sell" ? "bg-purple-50 text-purple-600 border-purple-100"
                    : item.listingType === "free" ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                    : "bg-teal-50 text-teal-600 border-teal-100"
                }`}>
                    {item.listingType === "sell" ? "Sale" : item.listingType === "free" ? "Free" : "Rent"}
                </span>
            </div>
        </button>
    );
}

export function SimilarItems({ currentItemId, categoryId, collegeId }: SimilarItemsProps) {
    const [items, setItems] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!db || (!categoryId && !collegeId)) {
            setLoading(false);
            return;
        }

        const fetchSimilar = async () => {
            try {
                // Query: .eq('college_id', ...).eq('category', ...).eq('status', 'available').neq('id', ...).limit(6)
                // Note: categoryId and collegeId are being used as they match our indexed fields.
                const q = query(
                    collection(db!, "rentals"),
                    where("collegeId", "==", collegeId),
                    where("categoryId", "==", categoryId),
                    where("status", "==", "available"),
                    limit(7) 
                );
                const snap = await getDocs(q);
                const results = snap.docs
                    .map(d => ({ id: d.id, ...d.data() } as Listing))
                    .filter(i => i.id !== currentItemId)
                    .slice(0, 6);
                setItems(results);
            } catch (err) {
                console.error("Similar items error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSimilar();
    }, [currentItemId, categoryId, collegeId]);

    // If 0 results → return null, hide section entirely.
    if (!loading && items.length === 0) return null;

    return (
        <div className="py-2">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Similar Items</h2>
            <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-2">
                {items.map(item => (
                    <SimilarCard key={item.id} item={item} />
                ))}
                {loading && [...Array(3)].map((_, i) => (
                    <div key={i} className="shrink-0 w-[140px] h-[190px] rounded-xl bg-slate-50 border border-slate-100 animate-pulse" />
                ))}
            </div>
        </div>
    );
}
