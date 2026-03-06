"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { useCollege } from "@/contexts/CollegeContext";
import { useNearestBlock } from "@/lib/hooks/useNearestBlock";
import { Listing } from "@/lib/types";
import { CATEGORIES } from "@/components/ui/CategoryGrid";
import { EmptyState } from "@/components/ui/EmptyState";
import { TopBar } from "@/components/layout/TopBar";
import { RentalCard } from "@/components/rental/RentalCard";
import { ChevronLeft, Loader2, Filter, ArrowUpDown } from "lucide-react";

export default function CategoryPage({ params }: { params: Promise<{ categoryId: string }> }) {
    const router = useRouter();
    const { categoryId } = use(params);
    const { selectedCollege, isReady } = useCollege();
    const { nearestBlock, isLoading: nearestLoading } = useNearestBlock(selectedCollege);

    const [rentals, setRentals] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);

    const category = CATEGORIES.find(c => c.id === categoryId);

    // Filter states
    const [selectedBranch, setSelectedBranch] = useState("All");
    const [selectedYear, setSelectedYear] = useState("All");
    const [sortOrder, setSortOrder] = useState<"nearest" | "lowest_price" | "newest">("nearest");

    useEffect(() => {
        if (!selectedCollege) {
            router.push("/home");
            return;
        }

        if (!db) return;
        setLoading(true);

        const q = query(
            collection(db, "rentals"),
            where("status", "==", "available"),
            where("collegeId", "==", selectedCollege.id),
            where("categoryId", "==", categoryId)
        );

        const unsub = onSnapshot(q, (snap) => {
            const rawRentals = snap.docs.map(d => ({ id: d.id, ...d.data() } as Listing));
            setRentals(rawRentals);
            setLoading(false);
        });

        return () => unsub();
    }, [selectedCollege, categoryId, router]);

    if (!isReady || !selectedCollege) return null;

    // Apply Client-Side Filters & Sorting
    let filteredRentals = rentals.filter(r => {
        if (selectedBranch !== "All" && r.branch !== selectedBranch) return false;
        if (selectedYear !== "All" && r.yearSection !== selectedYear) return false;
        return true;
    });

    if (sortOrder === "newest") {
        filteredRentals.sort((a, b) => {
            const aTime = (a.createdAt as any)?.toMillis?.() || 0;
            const bTime = (b.createdAt as any)?.toMillis?.() || 0;
            return bTime - aTime;
        });
    } else if (sortOrder === "lowest_price") {
        filteredRentals.sort((a, b) => a.pricePerHour - b.pricePerHour);
    } else if (sortOrder === "nearest") {
        // Nearest block items first
        if (nearestBlock) {
            filteredRentals.sort((a, b) => {
                const aIsNear = a.blockId === nearestBlock.id ? -1 : 1;
                const bIsNear = b.blockId === nearestBlock.id ? -1 : 1;
                return aIsNear - bIsNear;
            });
        }
    }

    const branches = ["All", "CSE", "ECE", "ME", "CE", "EEE"];
    const years = ["All", "1st Year", "2nd Year", "3rd Year", "4th Year"];

    return (
        <div className="flex-1 flex flex-col min-h-screen bg-slate-50 relative">
            <TopBar />

            <div className="mt-[72px] px-5 py-4">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-1 text-slate-500 font-bold text-sm mb-4 hover:text-indigo-600 transition"
                >
                    <ChevronLeft className="w-4 h-4" /> Back
                </button>

                <div className="flex items-center gap-3 mb-6">
                    {category && (
                        <div className={`w-12 h-12 rounded-2xl ${category.bg} flex items-center justify-center shrink-0`}>
                            <category.icon className={`w-6 h-6 ${category.color}`} />
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl font-black text-slate-800" style={{ fontFamily: "Outfit, sans-serif" }}>
                            {category?.name || "Category"}
                        </h1>
                        <p className="text-xs font-bold text-slate-500">
                            {rentals.length} items available
                        </p>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-2">
                    <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 shrink-0">
                        <Filter className="w-3.5 h-3.5 text-indigo-400" /> Branch:
                        <select
                            value={selectedBranch}
                            onChange={(e) => setSelectedBranch(e.target.value)}
                            className="bg-transparent outline-none ml-1 text-indigo-700"
                        >
                            {branches.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>

                    <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 shrink-0">
                        Year:
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="bg-transparent outline-none ml-1 text-indigo-700"
                        >
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>

                    <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 shrink-0">
                        <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400" /> Sort:
                        <select
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value as any)}
                            className="bg-transparent outline-none ml-1 text-indigo-700"
                        >
                            <option value="nearest">Nearest</option>
                            <option value="lowest_price">Lowest Price</option>
                            <option value="newest">Newest</option>
                        </select>
                    </div>
                </div>

                {/* Listings */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                    </div>
                ) : filteredRentals.length === 0 ? (
                    <div className="mt-10">
                        <EmptyState
                            title="No items found"
                            description={`No ${category?.name || 'items'} listed yet in ${selectedCollege.name}.`}
                            actionLabel="Be the first to list"
                            actionHref="/rentals/new"
                        />
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3 pb-10">
                        {filteredRentals.map((rental) => {
                            const isNear = sortOrder === "nearest" && nearestBlock && rental.blockId === nearestBlock.id;
                            return (
                                <div key={rental.id} className="relative">
                                    {isNear && (
                                        <div className="absolute -top-2 -right-2 z-10 bg-indigo-500 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm border border-indigo-600 shadow-indigo">
                                            Near You
                                        </div>
                                    )}
                                    <RentalCard item={rental} />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
