"use client";

import { useState, useEffect, useCallback, Suspense, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCollege } from "@/contexts/CollegeContext";
import { useListingMode } from "@/lib/hooks/useListingMode";
import { useSuggestions, useSearchResults } from "@/lib/hooks/useSearch";
import { useSearchHistory } from "@/lib/hooks/useSearchHistory";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchDropdown } from "@/components/search/SearchDropdown";
import { ResultsGrid } from "@/components/search/ResultsGrid";
import { SearchEmptyState } from "@/components/search/SearchEmptyState";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { SearchFilter } from "@/lib/types";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Plus, Search, X } from "lucide-react";

// ── Map FilterChip IDs ↔ API params ──────────────────────────────────────────
const CHIP_TO_MODE: Record<string, string> = { rent: "rent", buy: "buy", sell: "sell" };
const MODE_TO_CHIP = Object.fromEntries(Object.entries(CHIP_TO_MODE).map(([k, v]) => [v, k]));

const CHIP_TO_CATEGORY: Record<string, string> = {
    calculator: "calculator",
    drafter: "drafter",
    "lab-coat": "lab-coat",
    geometry: "geometry",
    electronics: "electronics",
    books: "books",
    others: "others",
    // Legacy aliases
    lab: "lab-coat",
    stationery: "geometry",
};
const CATEGORY_TO_CHIP = Object.fromEntries(Object.entries(CHIP_TO_CATEGORY).map(([k, v]) => [v, k]));

/**
 * Converts active chip IDs and sort value into a clean API filter object.
 */
function buildApiFilters(chips: string[], sort: string): SearchFilter & { mode?: string } {
    const f: SearchFilter & { mode?: string } = { sort: sort as any };
    const modeChip = chips.find(c => CHIP_TO_MODE[c]);
    if (modeChip) f.mode = CHIP_TO_MODE[modeChip];
    const catChip = chips.find(c => CHIP_TO_CATEGORY[c]);
    if (catChip) f.categoryId = CHIP_TO_CATEGORY[catChip];
    if (chips.includes("under50")) f.maxPrice = 50;
    return f;
}

/**
 * Converts deep-link params into a list of active chip IDs.
 */
function getChipsFromParams(searchParams: URLSearchParams): string[] {
    const chips: string[] = [];
    const m = searchParams.get("mode");
    if (m && MODE_TO_CHIP[m]) chips.push(MODE_TO_CHIP[m]);
    const c = searchParams.get("category");
    // Use category ID directly as a chip (all 7 categories are now in CHIP_TO_CATEGORY)
    if (c && CHIP_TO_CATEGORY[c]) chips.push(c);
    if (searchParams.get("maxPrice") === "50") chips.push("under50");
    return chips;
}

const CATEGORY_NAMES: Record<string, string> = {
    calculator: "Calculators",
    drafter: "Drafters",
    "lab-coat": "Lab Coats",
    geometry: "Geometry Sets",
    electronics: "Electronics",
    books: "Books & Notes",
    others: "Other Items",
};

function SearchPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { selectedCollege } = useCollege();
    const { listingMode: defaultMode } = useListingMode();

    const urlQuery = searchParams.get("q") || "";
    const urlCategory = searchParams.get("category") || "";
    const urlTab = searchParams.get("tab") || "all";
    const urlType = searchParams.get("mode") || searchParams.get("type") || "all";
    const isFirstMount = useRef(true);

    const [activeTab, setActiveTab] = useState(urlTab);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [activeFilters, setActiveFilters] = useState<string[]>(() => getChipsFromParams(searchParams));
    
    // Derived filters for the reactive hook
    const activeCategoryId = useMemo(() => activeFilters.find(f => CHIP_TO_CATEGORY[f]) || urlCategory, [activeFilters, urlCategory]);
    const activeMode = useMemo(() => activeFilters.find(f => CHIP_TO_MODE[f]) || urlType || defaultMode, [activeFilters, urlType, defaultMode]);

    const { query, setQuery, suggestions, clearSuggestions } = useSuggestions(selectedCollege?.id, activeMode);

    const { results, isLoading, totalCount } = useSearchResults({
        q: query,
        categoryId: activeCategoryId,
        mode: activeMode,
        collegeId: selectedCollege?.id,
        activeTab: activeTab,
        userBlock: userProfile?.block || userProfile?.hostel,
        shouldFetch: true
    });

    const { recentSearches, saveSearch, removeSearch } = useSearchHistory();

    const [showDropdown, setShowDropdown] = useState(false);
    const [sortBy, setSortBy] = useState(searchParams.get("sort") || "relevance");
    const [hasSearched, setHasSearched] = useState(() => !!urlQuery || !!urlCategory);

    const trendingSearches = ["Calculator", "Lab Coat", "Drafter", "Casio fx991", "Arduino"];
    const activeCategoryName = activeCategoryId ? CATEGORY_NAMES[activeCategoryId] : null;

    // ── Fetch User Profile for Nearby Block ────────────────────────────
    useEffect(() => {
        const userId = auth?.currentUser?.uid;
        if (userId && db) {
            getDoc(doc(db as any, "users", userId)).then(snap => {
                if (snap.exists()) setUserProfile(snap.data());
            }).catch(console.error);
        }
    }, [auth?.currentUser?.uid]);

    // ── Deep Linking: Initialize from URL on mount ──────────────────────────
    useEffect(() => {
        if (isFirstMount.current && (urlQuery || urlCategory)) {
            isFirstMount.current = false;
            if (urlQuery) setQuery(urlQuery);
            if (urlTab) setActiveTab(urlTab);
            setHasSearched(true);
        }
    }, [urlQuery, urlCategory, urlTab, setQuery]);

    // ── URL Sync: Keep URL in sync with reactive state ──────────────────────
    useEffect(() => {
        if (!isFirstMount.current && hasSearched) {
            const params = new URLSearchParams();
            if (query) params.set("q", query);
            if (activeTab !== "all") params.set("tab", activeTab);
            
            const apiFilters = buildApiFilters(activeFilters, sortBy);
            if (apiFilters.mode) params.set("mode", apiFilters.mode);
            // Always preserve category — either from active filter chip or from original URL param
            const categoryToWrite = apiFilters.categoryId || urlCategory;
            if (categoryToWrite) params.set("category", categoryToWrite);
            if (apiFilters.maxPrice) params.set("maxPrice", apiFilters.maxPrice.toString());
            if (sortBy !== "relevance") params.set("sort", sortBy);
            
            router.replace(`/search?${params.toString()}`, { scroll: false });
        }
    }, [activeFilters, sortBy, hasSearched, query, activeTab, router, urlCategory]);

    const handleSubmit = useCallback((q: string) => {
        if (!q.trim()) return;
        const trimmed = q.trim();
        setQuery(trimmed);
        saveSearch(trimmed);
        setShowDropdown(false);
        setHasSearched(true);
    }, [saveSearch, setQuery]);

    const handleQueryChange = useCallback((q: string) => {
        setQuery(q);
        if (q.length >= 2) setShowDropdown(true);
        else if (q.length === 0) {
            setShowDropdown(false);
            if (!urlQuery && !urlCategory) setHasSearched(false);
        }
    }, [setQuery, urlQuery, urlCategory]);

    const handleClear = useCallback(() => {
        clearSuggestions();
        setShowDropdown(false); 
        setHasSearched(false);
        setActiveFilters([]); 
        setSortBy("relevance");
        setActiveTab("all");
        router.push("/search", { scroll: false });
    }, [clearSuggestions, router]);

    const handleFilterToggle = useCallback((filterId: string) => {
        setHasSearched(true);
        setActiveFilters(prev =>
            filterId === "all"
                ? []
                : prev.includes(filterId)
                    ? prev.filter(f => f !== filterId)
                    : [...prev, filterId]
        );
    }, []);

    const handleSortChange = useCallback((sort: string) => {
        setSortBy(sort);
    }, []);

    const handleBack = () => {
        if (urlCategory || urlQuery) {
            router.push("/rentals");
        } else {
            router.back();
        }
    };

    const handleFabClick = () => {
        const typeParam = activeMode !== "all" ? activeMode : "rent";
        if (!auth?.currentUser) {
            router.push(`/login?redirect=/rentals/new?category=${activeCategoryId || urlCategory}&type=${typeParam}`);
        } else {
            router.push(`/rentals/new?category=${activeCategoryId || urlCategory}&type=${typeParam}`);
        }
    };

    const TABS = [
        { id: "all", label: "All" },
        { id: "nearby", label: "Nearby" },
        { id: "available", label: "Available" },
        { id: "budget", label: "Budget" },
        { id: "low-price", label: "Low Price" },
        { id: "top-rated", label: "Top Rated" },
    ];

    const getEmptyMessage = () => {
        if (!hasSearched) return null;
        if (results.length > 0) return null;
        
        switch (activeTab) {
            case "available": return "All items are currently borrowed. Check back soon!";
            case "budget": return "No items under ₹100. Try the Low Price tab.";
            case "top-rated": return "No ratings yet. Borrow an item and leave a review!";
            case "nearby": return `No items found in ${userProfile?.block || "your block"}. Try the All tab!`;
            default: return `No items found in ${activeCategoryName || "this category"}. Be the first to list!`;
        }
    };

    return (
        <div className="flex-1 flex flex-col min-h-screen bg-slate-50 relative">
            <TopBar />
            <div className="mt-[60px] relative">
                <SearchBar
                    query={query}
                    onQueryChange={handleQueryChange}
                    onSubmit={handleSubmit}
                    onFocus={() => { if (query.length >= 2 || recentSearches.length > 0) setShowDropdown(true); }}
                    onClear={handleClear}
                    onBack={handleBack}
                    placeholder={activeCategoryName 
                        ? `Search ${activeCategoryName.toLowerCase()}, blocks, price...` 
                        : "Search anything — Calculator, Drafter..."
                    }
                    autoFocus={!urlQuery && !urlCategory}
                />
                <div className="relative px-4">
                    <SearchDropdown
                        suggestions={suggestions}
                        recentSearches={recentSearches}
                        trendingSearches={trendingSearches}
                        collegeName={selectedCollege?.name || "Campus"}
                        query={query}
                        visible={showDropdown}
                        onSelect={handleSubmit}
                        onRemoveRecent={removeSearch}
                        onClose={() => setShowDropdown(false)}
                    />
                </div>
            </div>

            {hasSearched && (
                <div className="bg-white border-b border-slate-100 overflow-x-auto no-scrollbar py-2 px-4 shadow-sm z-10 sticky top-[116px]">
                    <div className="flex gap-2 min-w-max">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id); setHasSearched(true); }}
                                className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${
                                    activeTab === tab.id 
                                        ? "bg-indigo-600 text-white shadow-md active:scale-95" 
                                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <main className="flex-1 pb-24">
                {hasSearched && results.length === 0 && !isLoading ? (
                    <SearchEmptyState
                        query={query || activeCategoryName || "this category"}
                        message={getEmptyMessage() || undefined}
                        onSuggestionClick={handleSubmit}
                        onRequestClick={() => router.push("/requests/new")}
                    />
                ) : hasSearched ? (
                    <div className="animate-in fade-in duration-500 pt-3">
                        <ResultsGrid
                            results={results}
                            loading={isLoading}
                            query={query}
                            totalCount={totalCount}
                            sortBy={sortBy}
                            onSortChange={handleSortChange}
                        />
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                        <div className="text-5xl mb-4">🔍</div>
                        <p className="text-slate-500 font-bold text-sm">
                            Search anything — Calculator, Drafter, Lab Record...
                        </p>
                        <p className="text-slate-400 text-xs mt-1">
                            Type at least 2 characters to see suggestions
                        </p>
                    </div>
                )}
            </main>

            {/* Floating Action Button (Matches Home Page) */}
            {hasSearched && (activeCategoryId || urlCategory) && activeMode !== "buy" && (
                <button
                    onClick={handleFabClick}
                    className="fixed bottom-24 right-5 z-40 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white py-3 px-5 rounded-2xl shadow-indigo transition-all flex items-center gap-2 ring-4 ring-indigo-600/20"
                >
                    <Plus className="w-5 h-5 shrink-0" />
                    <span className="font-black text-[11px] uppercase tracking-widest">
                        + List {activeCategoryName
                            ? activeCategoryName.replace(/s$/, "") // "Calculators" → "Calculator"
                            : (activeMode === "sell" ? "Item" : "Item")}
                    </span>
                </button>
            )}

            <BottomNav />
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>}>
            <SearchPageContent />
        </Suspense>
    );
}
