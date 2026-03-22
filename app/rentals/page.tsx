"use client";

import { useCollege } from "@/contexts/CollegeContext";
import { CategoryGrid } from "@/components/ui/CategoryGrid";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Plus, Search, X } from "lucide-react";
import { auth } from "@/lib/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useListingMode } from "@/lib/hooks/useListingMode";
import { useSuggestions, useCategoryCounts } from "@/lib/hooks/useSearch";
import { useSearchHistory } from "@/lib/hooks/useSearchHistory";
import { SearchDropdown } from "@/components/search/SearchDropdown";

export default function RentalsMarketplace() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { selectedCollege, isReady } = useCollege();
    const { listingMode: contextMode, setListingMode } = useListingMode();
    const [showDropdown, setShowDropdown] = useState(false);

    // Sync mode from URL if present
    const urlType = searchParams.get("type") as "rent" | "buy" | "sell" | null;
    const activeMode = urlType || contextMode || "rent";

    // Suggestions hook — only fetch on this page
    const { query, setQuery, suggestions, clearSuggestions } = useSuggestions(selectedCollege?.id, true);
    const { recentSearches, removeSearch } = useSearchHistory();

    const trendingSearches = ["Calculator", "Lab Coat", "Drafter", "Casio fx991", "Arduino"];

    const { counts, loading: countsLoading } = useCategoryCounts(selectedCollege?.id, true);

    useEffect(() => {
        if (isReady && !selectedCollege) {
            router.push("/");
        }
    }, [isReady, selectedCollege, router]);

    // Update URL when mode changes
    const handleModeChange = (m: "rent" | "buy" | "sell") => {
        setListingMode(m);
        const params = new URLSearchParams(searchParams);
        params.set("type", m);
        router.replace(`/rentals?${params.toString()}`, { scroll: false });
    };

    if (!isReady || !selectedCollege) return null;

    const handleFabClick = () => {
        if (!auth?.currentUser) {
            router.push("/login?redirect=/rentals/new");
        } else {
            router.push(`/rentals/new?type=${activeMode}`);
        }
    };

    // When user selects a suggestion or presses Enter → navigate to /search
    const handleSearchSubmit = (q: string) => {
        if (!q.trim()) return;
        setShowDropdown(false);
        clearSuggestions();
        router.push(`/search?q=${encodeURIComponent(q.trim())}`);
    };

    return (
        <div className="flex-1 flex flex-col min-h-screen bg-slate-50 relative pb-20">
            <TopBar />

            <div className="mt-[80px] px-5 flex-1 flex flex-col">
                <div className="py-2">
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

                {/* Search Bar — Suggestions Only (navigates to /search on submit) */}
                <div className="mb-4 relative z-50">
                    <div className="flex items-center gap-2 bg-white border border-slate-100 rounded-full p-1 shadow-sm hover:border-indigo-100 transition-colors focus-within:ring-4 focus-within:ring-indigo-50 focus-within:border-indigo-300">
                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                            <Search className="w-4 h-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            value={query}
                            onChange={e => {
                                setQuery(e.target.value);
                                if (e.target.value.length >= 2 || recentSearches.length > 0) {
                                    setShowDropdown(true);
                                } else {
                                    setShowDropdown(false);
                                }
                            }}
                            onFocus={() => {
                                if (query.length >= 2 || recentSearches.length > 0) setShowDropdown(true);
                            }}
                            onKeyDown={e => {
                                if (e.key === "Enter" && query.trim()) handleSearchSubmit(query);
                                if (e.key === "Escape") { setShowDropdown(false); clearSuggestions(); }
                            }}
                            placeholder="Search items (calculator, lab coat...)"
                            className="flex-1 bg-transparent text-sm font-bold text-slate-800 placeholder-slate-400 outline-none"
                            autoComplete="off"
                        />
                        {query && (
                            <button onClick={() => { clearSuggestions(); setShowDropdown(false); }} className="p-2">
                                <X className="w-4 h-4 text-slate-400" />
                            </button>
                        )}
                    </div>

                    {/* Dropdown BELOW the search bar */}
                    <SearchDropdown
                        suggestions={suggestions}
                        recentSearches={recentSearches}
                        trendingSearches={trendingSearches}
                        collegeName={selectedCollege?.name || "Campus"}
                        query={query}
                        visible={showDropdown}
                        onSelect={handleSearchSubmit}
                        onRemoveRecent={removeSearch}
                        onClose={() => setShowDropdown(false)}
                    />
                </div>

                {/* Mode Selection */}
                <div className="flex gap-2 mb-4 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
                    {(["rent", "buy", "sell"] as const).map(m => (
                        <button
                            key={m}
                            onClick={() => handleModeChange(m)}
                            className={`flex-1 py-3 rounded-xl text-sm font-black capitalize transition-all active:scale-95 ${activeMode === m ? "bg-indigo-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"}`}
                        >
                            {m}
                        </button>
                    ))}
                </div>

                {/* Category grid — hide when dropdown is open */}
                {!showDropdown && (
                    <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-sm mb-24 overflow-hidden">
                        <div className="h-full overflow-y-auto no-scrollbar p-2">
                            <CategoryGrid counts={counts} loading={countsLoading} />
                        </div>
                    </div>
                )}
            </div>

            {/* Floating FAB */}
            {activeMode !== "buy" && (
                <button
                    onClick={handleFabClick}
                    className="fixed bottom-24 right-5 z-40 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white py-3 px-5 rounded-2xl shadow-indigo transition-all flex items-center gap-2 ring-4 ring-indigo-600/20"
                >
                    <Plus className="w-5 h-5 shrink-0" />
                    <span className="font-black text-[11px] uppercase tracking-widest">{activeMode === "sell" ? "Sell Item" : "List Item"}</span>
                </button>
            )}

            <BottomNav />
        </div>
    );
}
