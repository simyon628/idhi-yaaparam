import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";

export default function SearchLoading() {
    return (
        <div className="flex-1 flex flex-col min-h-screen bg-slate-50 relative pb-20">
            <TopBar />
            
            <div className="mt-[60px] px-4 space-y-4 animate-pulse">
                {/* Search Bar Skeleton */}
                <div className="h-14 bg-slate-200 rounded-2xl w-full" />
                
                {/* Filter Chips Skeleton */}
                <div className="flex gap-2 overflow-hidden mt-4">
                    <div className="h-8 bg-slate-200 rounded-full w-20 shrink-0" />
                    <div className="h-8 bg-slate-200 rounded-full w-24 shrink-0" />
                    <div className="h-8 bg-slate-200 rounded-full w-20 shrink-0" />
                    <div className="h-8 bg-slate-200 rounded-full w-28 shrink-0" />
                </div>
                
                {/* Results Grid Skeleton */}
                <div className="grid grid-cols-2 gap-3 mt-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-white rounded-3xl p-3 border border-slate-100 shadow-sm flex flex-col h-[280px]">
                            {/* Image placeholder */}
                            <div className="w-full h-[140px] bg-slate-100 rounded-2xl mb-3" />
                            {/* Title */}
                            <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                            {/* Location */}
                            <div className="h-3 bg-slate-100 rounded w-1/2 mb-auto" />
                            {/* Price */}
                            <div className="mt-3 flex justify-between items-end">
                                <div className="h-5 bg-slate-200 rounded w-1/3" />
                                <div className="h-4 bg-slate-100 rounded w-1/4" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <BottomNav />
        </div>
    );
}
