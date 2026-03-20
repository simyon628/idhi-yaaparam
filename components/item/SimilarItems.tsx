"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
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

    return (
        <button
            onClick={() => router.push(`/item/${item.id}`)}
            className="shrink-0 w-36 rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden flex flex-col text-left active:scale-[0.97] transition-transform hover:border-indigo-100 group"
        >
            <div className="w-full h-[90px] bg-slate-100 overflow-hidden relative">
                {!imgLoaded && <div className="absolute inset-0 bg-slate-200 animate-pulse" />}
                {item.photoUrl ? (
                    <img
                        src={item.photoUrl}
                        alt={item.itemName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onLoad={() => setImgLoaded(true)}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">
                        {item.icon || "📦"}
                    </div>
                )}
            </div>
            <div className="p-2.5 flex flex-col gap-1">
                <p className="text-xs font-bold text-slate-800 truncate leading-tight">{item.itemName}</p>
                <div className="flex items-center gap-0.5 text-slate-700">
                    <IndianRupee className="w-2.5 h-2.5" />
                    <span className="text-xs font-black">{item.pricePerHour}</span>
                    {(!item.listingType || item.listingType === "rent") && (
                        <span className="text-[9px] text-slate-400">/hr</span>
                    )}
                </div>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded w-fit ${
                    item.listingType === "sell" ? "bg-purple-50 text-purple-600"
                    : "bg-teal-50 text-teal-600"
                }`}>
                    {item.listingType === "sell" ? "For Sale" : "For Rent"}
                </span>
            </div>
        </button>
    );
}

export function SimilarItems({ currentItemId, categoryId, collegeId }: SimilarItemsProps) {
    const [items, setItems] = useState<Listing[]>([]);

    useEffect(() => {
        if (!categoryId || !collegeId || !db) return;

        const fetchSimilar = async () => {
            try {
                const q = query(
                    collection(db!, "rentals"),
                    where("collegeId", "==", collegeId),
                    where("categoryId", "==", categoryId),
                    where("status", "==", "available"),
                    orderBy("createdAt", "desc"),
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
            }
        };

        fetchSimilar();
    }, [currentItemId, categoryId, collegeId]);

    if (items.length === 0) return null;

    return (
        <div>
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">More like this</h2>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1">
                {items.map(item => (
                    <SimilarCard key={item.id} item={item} />
                ))}
            </div>
        </div>
    );
}
