"use client";

import Link from "next/link";
import { Listing } from "@/lib/types";
import { IndianRupee, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";

interface RentalCardProps {
    item: Listing;
}

export function RentalCard({ item }: RentalCardProps) {
    const router = useRouter();

    return (
        <button
            onClick={() => router.push(`/rentals/${item.id}`)}
            className="glass rounded-2xl overflow-hidden flex flex-col border border-slate-700/60 hover:border-indigo-500/40 active:scale-[0.97] transition-all text-left group shadow-premium"
        >
            {/* Image / Icon area */}
            <div className="aspect-square bg-[hsl(217,32%,16%)] flex items-center justify-center relative overflow-hidden">
                {item.photoUrl ? (
                    <img src={item.photoUrl} alt={item.itemName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-4xl">{item.icon}</span>
                    </div>
                )}
                {/* Price badge */}
                <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-amber-500/20 border border-amber-500/30 text-amber-400 backdrop-blur-sm px-2 py-1 rounded-lg">
                    <IndianRupee className="w-2.5 h-2.5" />
                    <span className="text-[11px] font-black">{item.pricePerHour}/hr</span>
                </div>
            </div>

            {/* Details */}
            <div className="p-3 space-y-2">
                <h3 className="font-bold text-white text-sm truncate leading-tight">{item.itemName}</h3>
                <div className="flex items-center gap-1 text-slate-500">
                    <MapPin className="w-3 h-3" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">{item.block}</span>
                </div>
                <div className="w-full py-2 rounded-lg gradient-indigo text-center">
                    <span className="text-white text-[11px] font-black uppercase tracking-wider">Rent Now</span>
                </div>
            </div>
        </button>
    );
}
