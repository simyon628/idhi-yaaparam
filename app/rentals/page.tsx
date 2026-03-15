"use client";

import { useCollege } from "@/contexts/CollegeContext";
import { CategoryGrid } from "@/components/ui/CategoryGrid";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Plus } from "lucide-react";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RentalsMarketplace() {
    const router = useRouter();
    const { selectedCollege, isReady } = useCollege();

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
            router.push("/rentals/new");
        }
    };

    return (
        <div className="flex-1 flex flex-col min-h-screen bg-slate-50 relative pb-20">
            <TopBar />

            <div className="mt-[80px] px-5 flex-1 flex flex-col">
                <div className="py-4 animate-page-enter">
                    <h1 className="text-2xl font-black text-slate-800 leading-tight" style={{ fontFamily: "Outfit, sans-serif" }}>
                        Marketplace
                    </h1>
                    <p className="text-indigo-500 font-bold text-xs uppercase tracking-wider mt-0.5">
                        {selectedCollege.name}
                    </p>
                </div>

                <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-sm mb-24 overflow-hidden">
                    <div className="h-full overflow-y-auto no-scrollbar p-2">
                        <CategoryGrid />
                    </div>
                </div>
            </div>

            {/* Floating FAB */}
            <button
                onClick={handleFabClick}
                className="fixed bottom-24 right-5 z-40 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white py-3 px-5 rounded-2xl shadow-indigo transition-all flex items-center gap-2 ring-4 ring-indigo-600/20"
            >
                <Plus className="w-5 h-5 shrink-0" />
                <span className="font-black text-[11px] uppercase tracking-widest">List Item</span>
            </button>

            <BottomNav />
        </div>
    );
}
