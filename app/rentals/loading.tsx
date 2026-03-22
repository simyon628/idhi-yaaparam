import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";

export default function RentalsLoading() {
    return (
        <div className="flex-1 flex flex-col min-h-screen bg-slate-50 relative pb-20">
            <TopBar />

            <div className="mt-[80px] px-5 flex-1 flex flex-col animate-pulse">
                <div className="py-2 mb-4">
                    <div className="h-3 bg-slate-200 rounded w-32 mb-2" />
                    <div className="h-8 bg-slate-300 rounded w-48 mb-2" />
                    <div className="h-4 bg-slate-200 rounded w-64" />
                </div>

                {/* Search Bar Skeleton */}
                <div className="h-14 bg-white border border-slate-100 rounded-full w-full mb-4 shadow-sm" />

                {/* Mode Selection Skeleton */}
                <div className="flex gap-2 mb-4 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex-1 h-12 bg-slate-100 rounded-xl" />
                    <div className="flex-1 h-12 bg-slate-200 rounded-xl" />
                    <div className="flex-1 h-12 bg-slate-100 rounded-xl" />
                </div>

                {/* Category Grid Skeleton */}
                <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-sm mb-24 p-4">
                    <div className="grid grid-cols-2 gap-3">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="flex flex-col p-4 rounded-2xl bg-slate-50 border border-slate-100 h-[100px]">
                                <div className="w-10 h-10 rounded-xl bg-slate-200 mb-2" />
                                <div className="h-4 bg-slate-300 rounded w-2/3 mb-1 mt-auto" />
                                <div className="h-3 bg-slate-200 rounded w-1/2" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <BottomNav />
        </div>
    );
}
