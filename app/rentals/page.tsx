"use client";

import { useCollege } from "@/contexts/CollegeContext";
import { CategoryGrid } from "@/components/ui/CategoryGrid";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Plus } from "lucide-react";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useListingMode } from "@/lib/hooks/useListingMode";

export default function RentalsMarketplace() {
    const router = useRouter();
    const { selectedCollege, isReady } = useCollege();
    const { listingMode, setListingMode } = useListingMode();

    useEffect(() => {
        if (isReady && !selectedCollege) {
            router.push("/");
        }
    }, [isReady, selectedCollege, router]);

    if (!isReady || !selectedCollege) return null;

    const handleFabClick = () => {
        if (!auth?.currentUser) {
            router.push("/login?redirect=/rentals/new");
        } else {
            router.push(`/rentals/new?type=${listingMode}`);
        }
    };

    return (
        <div className="flex-1 flex flex-col min-h-screen bg-slate-50 relative pb-20">
            <TopBar />

            <div className="mt-[80px] px-5 flex-1 flex flex-col">
                <div className="py-2 animate-page-enter">
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-1">
                        Welcome to {selectedCollege?.name}
                    </p>
                    <h1 className="text-3xl font-black text-slate-800 leading-tight mb-1" style={{ fontFamily: "Outfit, sans-serif" }}>
                        Marketplace
                    </h1>
                    <p className="text-xs font-bold text-slate-500">
                        Rent & borrow campus essentials from your friends
                    </p>
                </div>

                {/* Quick Search Bar directly above categories */}
                <div 
                    onClick={() => router.push("/search")}
                    className="mb-4 bg-white border border-slate-100 rounded-[1.5rem] p-3 flex items-center gap-3 shadow-sm cursor-text hover:border-indigo-100 transition-colors"
                >
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                        <span className="text-lg">🔍</span>
                    </div>
                    <input
                        type="text"
                        readOnly
                        placeholder="Search items in your college (calculator...)"
                        className="flex-1 bg-transparent text-sm font-bold text-slate-800 placeholder-slate-400 outline-none cursor-pointer"
                    />
                </div>

                {/* Mode Selection */}
                <div className="flex gap-2 mb-4 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
                    {(["rent", "buy", "sell"] as const).map(m => (
                        <button
                            key={m}
                            onClick={() => setListingMode(m)}
                            className={`flex-1 py-3 rounded-xl text-sm font-black capitalize transition-all active:scale-95 ${listingMode === m ? "bg-indigo-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"}`}
                        >
                            {m}
                        </button>
                    ))}
                </div>

                <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-sm mb-24 overflow-hidden">
                    <div className="h-full overflow-y-auto no-scrollbar p-2">
                        <CategoryGrid />
                    </div>
                </div>
            </div>

            {/* Floating FAB - hidden in Buy mode (browse-only) */}
            {listingMode !== "buy" && (
                <button
                    onClick={handleFabClick}
                    className="fixed bottom-24 right-5 z-40 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white py-3 px-5 rounded-2xl shadow-indigo transition-all flex items-center gap-2 ring-4 ring-indigo-600/20"
                >
                    <Plus className="w-5 h-5 shrink-0" />
                    <span className="font-black text-[11px] uppercase tracking-widest">{listingMode === "sell" ? "Sell Item" : "List Item"}</span>
                </button>
            )}

            <BottomNav />
        </div>
    );
}
