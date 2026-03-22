import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { ChevronLeft, Share2, Heart, Loader2 } from "lucide-react";

export default function ItemLoading() {
    return (
        <div className="flex-1 flex flex-col min-h-screen pb-24 bg-slate-50 animate-pulse">
            {/* Nav Header skeleton */}
            <header className="sticky top-0 z-50 h-[52px] flex items-center justify-between px-4 bg-transparent">
                <div className="w-9 h-9 rounded-full bg-slate-200 -ml-1" />
                <div className="w-24 h-4 bg-slate-200 rounded" />
                <div className="flex gap-2">
                    <div className="w-9 h-9 rounded-full bg-slate-200" />
                    <div className="w-9 h-9 rounded-full bg-slate-200" />
                </div>
            </header>

            {/* Hero Image Skeleton */}
            <div className="relative w-full bg-slate-200 -mt-[52px]" style={{ aspectRatio: "16/9" }}>
                <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                </div>
            </div>

            {/* Content sheet */}
            <div className="flex-1 px-5 pt-6 -mt-4 bg-slate-50 rounded-t-3xl relative z-10 border-t border-white shadow-sm">
                
                {/* Title and Badge Skeletons */}
                <div className="mb-6">
                    <div className="h-8 bg-slate-300 rounded w-3/4 mb-3" />
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-10 bg-slate-300 rounded-full w-40" />
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-10 bg-slate-300 rounded w-24" />
                        <div className="h-4 bg-slate-200 rounded w-16" />
                    </div>
                    {/* Tags */}
                    <div className="flex gap-2 mb-4">
                        <div className="h-6 bg-slate-200 rounded-full w-16" />
                        <div className="h-6 bg-slate-200 rounded-full w-20" />
                        <div className="h-6 bg-slate-200 rounded-full w-16" />
                    </div>
                </div>

                {/* Seller Card Skeleton */}
                <div className="bg-white rounded-2xl p-4 border border-slate-100 mb-6 flex items-center gap-3 shadow-sm">
                    <div className="w-12 h-12 rounded-full bg-slate-200" />
                    <div className="flex-1">
                        <div className="h-4 bg-slate-200 rounded w-1/2 mb-2" />
                        <div className="h-3 bg-slate-100 rounded w-1/3" />
                    </div>
                </div>

                {/* Details grid skeleton */}
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm mb-6">
                    <div className="h-3 bg-slate-200 rounded w-24 mb-4" />
                    <div className="grid grid-cols-2 gap-4">
                        <div className="h-10 bg-slate-100 rounded-xl w-full" />
                        <div className="h-10 bg-slate-100 rounded-xl w-full" />
                        <div className="h-10 bg-slate-100 rounded-xl w-full" />
                        <div className="h-10 bg-slate-100 rounded-xl w-full" />
                    </div>
                </div>
            </div>

            {/* Fixed Action Bar Skeleton */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-indigo-50 px-5 py-4 max-w-md mx-auto z-50 pb-safe">
                <div className="w-full h-14 bg-slate-200 rounded-2xl" />
            </div>
        </div>
    );
}
