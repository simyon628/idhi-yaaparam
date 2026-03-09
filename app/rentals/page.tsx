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
                <div className="py-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h1 className="text-3xl font-black text-slate-800 leading-tight" style={{ fontFamily: "Outfit, sans-serif" }}>
                        What you can rent in <br className="hidden md:block" />
                        <span className="text-indigo-600">{selectedCollege.name}</span>
                    </h1>
                    <p className="text-slate-500 font-medium mt-2 text-sm max-w-[280px]">
                        Choose a category to see what’s available in your campus.
                    </p>
                </div>

                <div className="mt-2 bg-white rounded-3xl p-2 border border-slate-100 shadow-sm relative overflow-hidden flex-1 mb-24">
                    <CategoryGrid />
                </div>
            </div>

            {/* Floating FAB for "Rent your item" (Mobile First) */}
            <button
                onClick={handleFabClick}
                className="fixed bottom-24 right-5 z-40 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white py-3 px-4 rounded-2xl shadow-indigo transition-all flex items-center justify-center border border-white/20 gap-2"
            >
                <Plus className="w-5 h-5" />
                <span className="font-bold text-sm">List Item</span>
            </button>

            <BottomNav />
        </div>
    );
}
