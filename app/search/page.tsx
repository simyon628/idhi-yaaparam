"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { useCollege } from "@/contexts/CollegeContext";
import { Listing } from "@/lib/types";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { RentalCard } from "@/components/rental/RentalCard";
import { Search, Loader2, SlidersHorizontal, X, IndianRupee } from "lucide-react";
import { CATEGORIES } from "@/components/ui/CategoryGrid";

export default function SearchPage() {
    const router = useRouter();
    const { selectedCollege } = useCollege();
    const [query_, setQuery_] = useState("");
    const [results, setResults] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    // Filter state
    const [filterCategory, setFilterCategory] = useState("All");
    const [filterMaxPrice, setFilterMaxPrice] = useState(500);
    const [filterSort, setFilterSort] = useState<"newest" | "price_asc" | "price_desc">("newest");

    const handleSearch = useCallback(async () => {
        if (!selectedCollege || !db) return;
        setLoading(true);
        setSearched(true);
        try {
            const q = query(
                collection(db, "rentals"),
                where("collegeId", "==", selectedCollege.id),
                where("status", "==", "available")
            );
            const snap = await getDocs(q);
            let items: Listing[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as Listing));

            // Client-side text filter
            if (query_.trim()) {
                const lower = query_.toLowerCase();
                items = items.filter(i =>
                    i.itemName.toLowerCase().includes(lower) ||
                    (i.department || "").toLowerCase().includes(lower)
                );
            }

            // Category filter
            if (filterCategory !== "All") {
                const cat = CATEGORIES.find(c => c.name === filterCategory);
                if (cat) items = items.filter(i => i.categoryId === cat.id);
            }

            // Price filter
            items = items.filter(i => i.pricePerHour <= filterMaxPrice);

            // Sort
            if (filterSort === "newest") {
                items.sort((a, b) => ((b.createdAt as any)?.toMillis?.() || 0) - ((a.createdAt as any)?.toMillis?.() || 0));
            } else if (filterSort === "price_asc") {
                items.sort((a, b) => a.pricePerHour - b.pricePerHour);
            } else {
                items.sort((a, b) => b.pricePerHour - a.pricePerHour);
            }

            setResults(items);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [selectedCollege, query_, filterCategory, filterMaxPrice, filterSort]);

    useEffect(() => {
        const t = setTimeout(() => {
            if (query_.length > 1) handleSearch();
        }, 400);
        return () => clearTimeout(t);
    }, [query_, handleSearch]);

    return (
        <div className="flex-1 flex flex-col min-h-screen bg-slate-50 pb-24">
            <TopBar />

            <div className="sticky top-[60px] z-30 bg-white/90 backdrop-blur-xl border-b border-slate-100 px-5 py-3 space-y-3">
                {/* Search Bar */}
                <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 h-12 focus-within:border-indigo-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-50 transition-all shadow-inner">
                        <Search className="w-4 h-4 text-slate-400 shrink-0" />
                        <input
                            type="text"
                            value={query_}
                            onChange={e => setQuery_(e.target.value)}
                            placeholder="Search calculator, drafter, multimeter..."
                            className="flex-1 bg-transparent text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none"
                            autoFocus
                        />
                        {query_ && (
                            <button onClick={() => { setQuery_(""); setResults([]); setSearched(false); }}>
                                <X className="w-4 h-4 text-slate-400" />
                            </button>
                        )}
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all ${showFilters ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-slate-200 text-slate-600"} shadow-sm`}
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                    </button>
                </div>

                {/* Filters Panel */}
                {showFilters && (
                    <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-4 shadow-md animate-in slide-in-from-top-2">
                        {/* Category */}
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Category</label>
                            <div className="flex flex-wrap gap-2">
                                {["All", ...CATEGORIES.map(c => c.name)].map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setFilterCategory(cat)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${filterCategory === cat ? "bg-indigo-600 text-white border-indigo-600" : "bg-slate-50 text-slate-600 border-slate-200"}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Price Range */}
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Max Price: ₹{filterMaxPrice}</label>
                            <input
                                type="range" min={10} max={500} step={10}
                                value={filterMaxPrice} onChange={e => setFilterMaxPrice(Number(e.target.value))}
                                className="w-full accent-indigo-600"
                            />
                        </div>

                        {/* Sort */}
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Sort By</label>
                            <div className="flex gap-2">
                                {[
                                    { key: "newest", label: "Newest" },
                                    { key: "price_asc", label: "Price ↑" },
                                    { key: "price_desc", label: "Price ↓" }
                                ].map(s => (
                                    <button
                                        key={s.key}
                                        onClick={() => setFilterSort(s.key as any)}
                                        className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all ${filterSort === s.key ? "bg-indigo-600 text-white border-indigo-600" : "bg-slate-50 text-slate-600 border-slate-200"}`}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleSearch}
                            className="w-full h-11 rounded-xl bg-indigo-600 text-white font-black text-sm"
                        >
                            Apply Filters
                        </button>
                    </div>
                )}
            </div>

            <main className="px-5 pt-5 space-y-4">
                {loading ? (
                    <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-400" /></div>
                ) : searched && results.length === 0 ? (
                    <div className="text-center py-16">
                        <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-bold">No items found for "{query_}"</p>
                        <p className="text-slate-400 text-sm mt-1">Try a different keyword or remove filters</p>
                    </div>
                ) : !searched ? (
                    <div className="text-center py-16">
                        <div className="text-5xl mb-3">🔍</div>
                        <p className="text-slate-500 font-bold text-sm">Search anything — Calculator, Drafter, Lab Record...</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{results.length} items found</p>
                        {results.map(item => (
                            <div key={item.id} onClick={() => router.push(`/rentals/${item.id}`)} className="cursor-pointer">
                                <RentalCard item={item} />
                            </div>
                        ))}
                    </div>
                )}
            </main>
            <BottomNav />
        </div>
    );
}
