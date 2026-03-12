"use client";

import { useState } from "react";
import { Listing } from "@/lib/types";
import { IndianRupee, MapPin, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

interface RentalCardProps {
    item: Listing;
}

export function RentalCard({ item }: RentalCardProps) {
    const router = useRouter();
    const [imgLoaded, setImgLoaded] = useState(false);

    // Show "New" badge if listed within last 30 minutes
    const isNew = item.createdAt && typeof (item.createdAt as any).toMillis === "function"
        ? Date.now() - (item.createdAt as any).toMillis() < 30 * 60 * 1000
        : false;

    return (
        <button
            onClick={() => router.push(`/rentals/${item.id}`)}
            className="w-full h-full bg-white rounded-2xl overflow-hidden flex flex-col border border-slate-100 hover:border-indigo-200 active:scale-[0.97] transition-all text-left shadow-sm group hover:shadow-md hover:-translate-y-0.5 duration-200"
        >
            {/* Image Area */}
            <div className="aspect-square bg-slate-50 flex items-center justify-center relative overflow-hidden w-full">
                {/* Shimmer skeleton shown until image loads */}
                {!imgLoaded && item.photoUrl && (
                    <div className="absolute inset-0 skeleton" />
                )}

                {item.photoUrl ? (
                    <img
                        src={item.photoUrl}
                        alt={item.itemName}
                        onLoad={() => setImgLoaded(true)}
                        className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
                    />
                ) : (
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-4xl drop-shadow-sm">{item.icon || '📦'}</span>
                    </div>
                )}

                {/* Department Badge */}
                <div className="absolute top-2 left-2 flex items-center gap-1 bg-white/90 backdrop-blur-md border border-white px-2 py-0.5 rounded-full shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest">{item.department ? item.department.split(' ')[0] : "Gen"}</span>
                </div>

                {/* New Badge */}
                {isNew && (
                    <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-indigo-500 text-white px-1.5 py-0.5 rounded-full shadow-sm">
                        <Zap className="w-2.5 h-2.5" />
                        <span className="text-[8px] font-black uppercase tracking-widest">New</span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-3 flex flex-col flex-1 gap-2">
                <div>
                    <h3 className="font-bold text-slate-800 text-xs truncate leading-tight">{item.itemName}</h3>
                    <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        <MapPin className="w-2.5 h-2.5" />
                        <span className="truncate">{item.block || "Campus"}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-50">
                    <div className="flex items-center gap-0.5 text-slate-800 font-black text-sm">
                        <IndianRupee className="w-3 h-3" />
                        <span>{item.pricePerHour}</span>
                        <span className="text-[8px] text-slate-400 uppercase ml-0.5">/hr</span>
                    </div>
                </div>

                {/* CTA */}
                <div className="w-full py-2 mt-1 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-200 flex items-center justify-center text-[10px] font-black uppercase tracking-widest">
                    Borrow Now
                </div>
            </div>
        </button>
    );
}
