"use client";

import { Listing } from "@/lib/types";
import { RentalCard } from "@/components/rental/RentalCard";
import { useRouter } from "next/navigation";

interface ResultsGridProps {
    results: Listing[];
    loading: boolean;
    query: string;
    totalCount: number;
    sortBy: string;
    onSortChange: (sort: string) => void;
}

// Skeleton loader — 4 animated cards (2x2)
function SkeletonGrid() {
    return (
        <div className="grid grid-cols-2 gap-3 px-4 pt-4">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                    <div className="h-32 bg-slate-200 animate-pulse" />
                    <div className="p-3 space-y-2">
                        <div className="h-3 bg-slate-200 rounded-full animate-pulse w-3/4" />
                        <div className="h-3 bg-slate-200 rounded-full animate-pulse w-1/2" />
                        <div className="h-4 bg-slate-100 rounded-full animate-pulse w-1/3 mt-2" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function ResultsGrid({ results, loading, query, totalCount, sortBy, onSortChange }: ResultsGridProps) {
    const router = useRouter();

    if (loading) return <SkeletonGrid />;

    return (
        <div className="px-4 pt-3 pb-24">
            {/* Results header */}
            <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-slate-500">
                    <span className="font-black text-slate-800">{totalCount}</span> results for &ldquo;<span className="text-indigo-600">{query}</span>&rdquo;
                </p>
                <select
                    value={sortBy}
                    onChange={e => onSortChange(e.target.value)}
                    className="text-[11px] font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-indigo-400"
                >
                    <option value="relevance">Relevance</option>
                    <option value="price_asc">Price: Low → High</option>
                    <option value="price_desc">Price: High → Low</option>
                    <option value="newest">Newest First</option>
                </select>
            </div>

            {/* 2-col grid */}
            <div className="grid grid-cols-2 gap-3">
                {results.map(item => (
                    <div
                        key={item.id}
                        onClick={() => router.push(`/rentals/${item.id}`)}
                        className="cursor-pointer active:scale-[0.97] transition-transform"
                    >
                        <RentalCard item={item} highlight={query} />
                    </div>
                ))}
            </div>
        </div>
    );
}
