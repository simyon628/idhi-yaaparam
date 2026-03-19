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
import { Search, Loader2, SlidersHorizontal, X, IndianRupee, ArrowUpLeft } from "lucide-react";
import { CATEGORIES } from "@/components/ui/CategoryGrid";

const SUGGESTION_DETAILS: Record<string, { category: string; icon: string }> = {
    "Calculator": { category: "Calculators", icon: "🔢" },
    "Casio fx991": { category: "Calculators", icon: "🔢" },
    "Casio 897": { category: "Calculators", icon: "🔢" },
    "Drafter": { category: "Lab Gear", icon: "📏" },
    "Mini Drafter": { category: "Lab Gear", icon: "📏" },
    "Mobile": { category: "Electronics", icon: "📱" },
    "Cycle": { category: "Transport", icon: "🚲" },
    "Cooler": { category: "Gadgets", icon: "❄️" },
    "Lab Record": { category: "Books & Notes", icon: "📘" },
    "Lab Coat": { category: "Lab Gear", icon: "🧥" },
    "Geometry Box": { category: "Lab Gear", icon: "📐" },
    "Arduino Uno": { category: "Electronics", icon: "🔋" },
    "Multimeter": { category: "Electronics", icon: "📟" },
    "Engineering Drawing Kit": { category: "Lab Gear", icon: "📐" },
};

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
    const [allSuggestions, setAllSuggestions] = useState<string[]>([]);

    const POPULAR_ITEMS = [
        "Calculator", "Casio fx991", "Casio 897", "Drafter", "Mini Drafter", "Mobile", "Cycle", "Cooler", 
        "Lab Record", "Lab Coat", "Geometry Box", "Arduino Uno", "Multimeter", "Engineering Drawing Kit"
    ];

    // Fetch all item names in this college for true auto-suggest
    useEffect(() => {
        if (!selectedCollege || !db) return;
        const q = query(
            collection(db, "rentals"),
            where("collegeId", "==", selectedCollege.id),
            where("status", "==", "available")
        );
        getDocs(q).then(snap => {
            const names = new Set<string>();
            snap.docs.forEach(d => {
                const name = d.data().itemName;
                if (name) names.add(name);
            });
            // Combine popular items with actual database items
            POPULAR_ITEMS.forEach(item => names.add(item));
            setAllSuggestions(Array.from(names));
        });
    }, [selectedCollege]);

    const handleSearch = useCallback(async (forcedQuery?: string) => {
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

            // Client-side text filter (Fuzzy multi-word match for title, brand, model, tags, category)
            const activeQuery = typeof forcedQuery === "string" ? forcedQuery : query_;
            if (activeQuery.trim()) {
                const cleanQuery = activeQuery.toLowerCase().trim();
                const searchTerms = cleanQuery.split(" ").filter(Boolean);
                items = items.filter(i => {
                    const searchableText = `${i.itemName} ${i.department || ""} ${i.categoryId || ""} ${i.block || ""} ${i.branch || ""}`.toLowerCase();
                    // Laptop fix: ensure partial matches work better
                    return searchTerms.every(term => searchableText.includes(term));
                });
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
                            placeholder="Search items in your college (calculator, Casio, books...)"
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
                            onClick={() => handleSearch()}
                            className="w-full h-11 rounded-xl bg-indigo-600 text-white font-black text-sm"
                        >
                            Apply Filters
                        </button>
                    </div>
                )}
            </div>

            <main className="px-5 pt-5 space-y-4 relative">
                {/* Auto-suggest Dropdown */}
                {(() => {
                    if (!query_ || searched) return null;
                    const filteredSuggestions = allSuggestions
                        .filter(name => name.toLowerCase().includes(query_.toLowerCase()))
                        .slice(0, 10);
                    
                    if (filteredSuggestions.length === 0) return null;

                    return (
                        <div className="absolute top-0 left-5 right-5 z-40 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2">
                            {filteredSuggestions.map(name => {
                                const lowerName = name.toLowerCase();
                                const lowerQuery = query_.toLowerCase();
                                const matchIndex = lowerName.indexOf(lowerQuery);
                                
                                // Flipkart style: match part is normal/light, completion part is bold
                                const prefix = name.substring(0, matchIndex + query_.length);
                                const boldPart = name.substring(matchIndex + query_.length);
                                const detail = SUGGESTION_DETAILS[name] || { category: "Items", icon: "📦" };
                                
                                return (
                                    <button
                                        key={name}
                                        onClick={() => { setQuery_(name); handleSearch(name); }}
                                        className="w-full px-5 py-4 text-left hover:bg-slate-50 flex items-center justify-between border-b border-slate-100 last:border-none group active:bg-slate-100"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-lg shadow-sm border border-slate-200 group-hover:bg-white group-hover:scale-110 transition-all">
                                                {detail.icon}
                                            </div>
                                            <div>
                                                <div className="text-sm">
                                                    <span className="font-medium text-slate-400">{prefix}</span>
                                                    <span className="font-black text-slate-900">{boldPart}</span>
                                                </div>
                                                <div className="text-[10px] font-bold text-indigo-500 mt-0.5 group-hover:translate-x-1 transition-transform inline-block">
                                                    in {detail.category}
                                                </div>
                                            </div>
                                        </div>
                                        <ArrowUpLeft className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 rotate-90 transition-all opacity-0 group-hover:opacity-100" />
                                    </button>
                                );
                            })}
                        </div>
                    );
                })()}

                {loading ? (
                    <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-400" /></div>
                ) : searched && results.length === 0 ? (
                    <div className="text-center py-16 px-6">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-10 h-10 text-slate-300" />
                        </div>
                        <p className="text-slate-800 font-black text-lg">No "{query_}" found</p>
                        <p className="text-slate-500 text-sm mt-1 mb-8">Nobody has listed this in your college yet. Why not request it?</p>
                        
                        <button 
                            onClick={() => router.push("/requests/new")}
                            className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-indigo active:scale-95 transition-all"
                        >
                            Request This Item
                        </button>
                    </div>
                ) : !searched ? (
                    <div className="py-6 space-y-6">
                        <div className="text-center">
                            <div className="text-5xl mb-3">🔍</div>
                            <p className="text-slate-500 font-bold text-sm">Search anything — Calculator, Drafter, Lab Record...</p>
                        </div>
                        
                        {/* Trending/Recent Searches placeholder */}
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1 flex items-center gap-2">
                                <span className="w-1 h-1 bg-indigo-500 rounded-full animate-pulse"></span>
                                Suggested for you
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {["Calculator", "Drafter", "Lab Coat", "Scientific Calculator", "Casio fx991", "Reference Books"].map(tag => (
                                    <button 
                                        key={tag}
                                        onClick={() => { setQuery_(tag); handleSearch(tag); }}
                                        className="px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-[11px] font-black text-slate-600 hover:border-indigo-400 hover:text-indigo-600 active:scale-95 transition-all shadow-sm flex items-center gap-2"
                                    >
                                        {tag}
                                        <ArrowUpLeft className="w-3 h-3 text-slate-300 opacity-40 rotate-90" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{results.length} items found</p>
                            <button onClick={() => setSearched(false)} className="text-[10px] font-black text-indigo-500 uppercase">Clear</button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {results.map(item => (
                                <div key={item.id} onClick={() => router.push(`/rentals/${item.id}`)} className="cursor-pointer">
                                    <RentalCard item={item} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
            <BottomNav />
        </div>
    );
}
