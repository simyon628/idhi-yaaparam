"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useCollege } from "@/contexts/CollegeContext";
import { useNearestBlock } from "@/lib/hooks/useNearestBlock";
import { useCampusBlocks } from "@/lib/hooks/useCampusBlocks";
import { Listing } from "@/lib/types";
import { CATEGORIES } from "@/components/ui/CategoryGrid";
import { EmptyState } from "@/components/ui/EmptyState";
import { TopBar } from "@/components/layout/TopBar";
import { RentalCard } from "@/components/rental/RentalCard";
import { ChevronLeft, Loader2, Filter, ArrowUpDown, Plus } from "lucide-react";
import { auth } from "@/lib/firebase";

export default function CategoryPage({ params }: { params: Promise<{ categoryId: string }> }) {
    const router = useRouter();
    const { categoryId } = use(params);
    const { selectedCollege, isReady } = useCollege();
    const { nearestBlock } = useNearestBlock(selectedCollege);
    const { formatting: blockNames } = useCampusBlocks(selectedCollege);

    const [rentals, setRentals] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);

    const category = CATEGORIES.find(c => c.id === categoryId);
    const categoryName = category?.name || "Category";
    const pluralCategoryName = categoryName.endsWith("s") ? categoryName : `${categoryName}s`;

    // Filter states
    const [selectedBranch, setSelectedBranch] = useState("All");
    const [selectedYear, setSelectedYear] = useState("All");
    const [selectedBlock, setSelectedBlock] = useState("All");
    const [sortOrder, setSortOrder] = useState<"nearest" | "lowest_price" | "newest">("nearest");

    useEffect(() => {
        if (!selectedCollege || !db) return;
        setLoading(true);

        const q = query(
            collection(db, "rentals"),
            where("collegeId", "==", selectedCollege.id),
            where("categoryId", "==", categoryId)
        );

        const unsub = onSnapshot(q, (snap) => {
            const rawRentals = snap.docs.map(d => ({ id: d.id, ...d.data() } as Listing));
            setRentals(rawRentals);
            setLoading(false);
        });

        return () => unsub();
    }, [selectedCollege, categoryId]);

    const handleFabClick = () => {
        const url = `/rentals/new?category=${categoryId}`;
        if (!auth?.currentUser) {
            router.push(`/login?redirect=${encodeURIComponent(url)}`);
        } else {
            router.push(url);
        }
    };

    if (!isReady || !selectedCollege) return null;

    let filteredRentals = rentals.filter(r => {
        if (selectedBranch !== "All" && r.branch !== selectedBranch) return false;
        if (selectedYear !== "All" && r.yearSection !== selectedYear) return false;
        if (selectedBlock !== "All" && r.block !== selectedBlock) return false;
        return true;
    });

    if (sortOrder === "newest") {
        filteredRentals.sort((a, b) => ((b.createdAt as any)?.toMillis?.() || 0) - ((a.createdAt as any)?.toMillis?.() || 0));
    } else if (sortOrder === "lowest_price") {
        filteredRentals.sort((a, b) => a.pricePerHour - b.pricePerHour);
    } else if (sortOrder === "nearest" && nearestBlock) {
        filteredRentals.sort((a, b) => (a.block === nearestBlock.name ? -1 : 1) - (b.block === nearestBlock.name ? -1 : 1));
    }

    const branches = ["All", "CSE", "ECE", "ME", "CE", "EEE"];
    const years = ["All", "1st Year", "2nd Year", "3rd Year", "4th Year"];

    return (
        <div className="flex-1 flex flex-col min-h-screen bg-slate-50 relative pb-24">
            <TopBar />

            <div className="mt-[72px] px-5 py-4">
                <button onClick={() => router.back()} className="flex items-center gap-1 text-slate-500 font-bold text-sm mb-4">
                    <ChevronLeft className="w-4 h-4" /> Back
                </button>

                <div className="flex items-center gap-3 mb-6">
                    {category && (
                        <div className={`w-12 h-12 rounded-2xl ${category.bg} flex items-center justify-center shrink-0 border border-slate-100`}>
                            <category.icon className={`w-6 h-6 ${category.color}`} />
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl font-black text-slate-800" style={{ fontFamily: "Outfit, sans-serif" }}>{pluralCategoryName}</h1>
                        <p className="text-xs font-bold text-slate-500">{selectedCollege.name}</p>
                    </div>
                    <button onClick={handleFabClick} className="ml-auto bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-100 shadow-sm active:scale-95 transition-all">
                        List {categoryName} +
                    </button>
                </div>

                <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-2">
                    <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 shrink-0">
                        <Filter className="w-3.5 h-3.5 text-indigo-400" /> Branch:
                        <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)} className="bg-transparent outline-none ml-1 text-indigo-700">
                            {branches.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 shrink-0">
                        Year/Sec:
                        <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="bg-transparent outline-none ml-1 text-indigo-700">
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 shrink-0">
                         <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400" /> Sort:
                        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as any)} className="bg-transparent outline-none ml-1 text-indigo-700">
                            <option value="nearest">Nearest</option>
                            <option value="lowest_price">Lowest Price</option>
                            <option value="newest">Newest</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-400" /></div>
                ) : filteredRentals.length === 0 ? (
                    <div className="mt-10">
                        <EmptyState
                            title={`No ${categoryName} listed yet.`}
                            description="Be the first to list and earn trust coins."
                            actionLabel={`List ${categoryName}`}
                            actionHref={`/rentals/new?category=${categoryId}`}
                        />
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {filteredRentals.map((rental) => (
                            <RentalCard key={rental.id} item={rental} />
                        ))}
                    </div>
                )}
            </div>

            <button onClick={handleFabClick} className="fixed bottom-24 right-5 z-40 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white py-4 px-6 rounded-2xl shadow-indigo transition-all flex items-center gap-2 ring-4 ring-indigo-600/20">
                <Plus className="w-5 h-5 shrink-0" />
                <span className="font-black text-xs uppercase tracking-widest">List {categoryName}</span>
            </button>
        </div>
    );
}
