"use client";

import { useState, useEffect, useCallback, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCollege } from "@/contexts/CollegeContext";
import { useListingMode } from "@/lib/hooks/useListingMode";
import { useSuggestions, useSearchResults } from "@/lib/hooks/useSearch";
import { useSearchHistory } from "@/lib/hooks/useSearchHistory";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchDropdown } from "@/components/search/SearchDropdown";
import { FilterChips } from "@/components/search/FilterChips";
import { ResultsGrid } from "@/components/search/ResultsGrid";
import { SearchEmptyState } from "@/components/search/SearchEmptyState";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { SearchFilter } from "@/lib/types";

// ── Map FilterChip IDs ↔ API params ──────────────────────────────────────────
const CHIP_TO_MODE: Record<string, string> = { rent: "rent", buy: "buy", sell: "sell" };
const MODE_TO_CHIP = Object.fromEntries(Object.entries(CHIP_TO_MODE).map(([k, v]) => [v, k]));

const CHIP_TO_CATEGORY: Record<string, string> = {
    calculator: "calculator",
    books: "books",
    electronics: "electronics",
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
    if (c && CATEGORY_TO_CHIP[c]) chips.push(CATEGORY_TO_CHIP[c]);
    if (searchParams.get("maxPrice") === "50") chips.push("under50");
    return chips;
}

function SearchPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { selectedCollege } = useCollege();
    const { listingMode: defaultMode } = useListingMode();

    const urlQuery = searchParams.get("q") || "";
    const isFirstMount = useRef(true);

    const { query, setQuery, suggestions, clearSuggestions } = useSuggestions(selectedCollege?.id);
    const { results, loading, totalCount, search, clearResults } = useSearchResults(selectedCollege?.id, defaultMode);
    const { recentSearches, saveSearch, removeSearch } = useSearchHistory();

    const [showDropdown, setShowDropdown] = useState(false);
    const [activeFilters, setActiveFilters] = useState<string[]>(() => getChipsFromParams(searchParams));
    const [sortBy, setSortBy] = useState(searchParams.get("sort") || "relevance");
    const [hasSearched, setHasSearched] = useState(false);

    const trendingSearches = ["Calculator", "Lab Coat", "Drafter", "Casio fx991", "Arduino"];

    // ── Deep Linking: Initialize from URL on mount ──────────────────────────
    useEffect(() => {
        if (isFirstMount.current) {
            isFirstMount.current = false;
            const hasCategory = searchParams.get("category");
            if (urlQuery || hasCategory) {
                if (urlQuery) setQuery(urlQuery);
                search(urlQuery, buildApiFilters(getChipsFromParams(searchParams), sortBy));
                setHasSearched(true);
            }
        }
    }, [urlQuery, searchParams, sortBy, setQuery, search]);

    // ── Reactive Search: Observe filter/sort changes ─────────────────────────
    useEffect(() => {
        if (!isFirstMount.current && hasSearched && query.trim()) {
            search(query, buildApiFilters(activeFilters, sortBy));
            
            // Sync URL (debouced or silent update could be better, but simple push for now)
            const params = new URLSearchParams();
            params.set("q", query);
            const apiFilters = buildApiFilters(activeFilters, sortBy);
            if (apiFilters.mode) params.set("mode", apiFilters.mode);
            if (apiFilters.categoryId) params.set("category", apiFilters.categoryId);
            if (apiFilters.maxPrice) params.set("maxPrice", apiFilters.maxPrice.toString());
            if (sortBy !== "relevance") params.set("sort", sortBy);
            router.replace(`/search?${params.toString()}`, { scroll: false });
        }
    }, [activeFilters, sortBy, hasSearched, query, search, router]);

    const handleSubmit = useCallback((q: string) => {
        if (!q.trim()) return;
        const trimmed = q.trim();
        setQuery(trimmed);
        saveSearch(trimmed);
        setShowDropdown(false);
        setHasSearched(true);
        search(trimmed, buildApiFilters(activeFilters, sortBy));
    }, [saveSearch, search, setQuery, activeFilters, sortBy]);

    const handleQueryChange = useCallback((q: string) => {
        setQuery(q);
        if (q.length >= 2) setShowDropdown(true);
        else if (q.length === 0) {
            setShowDropdown(false);
            if (!urlQuery) { clearResults(); setHasSearched(false); }
        }
    }, [setQuery, clearResults, urlQuery]);

    const handleClear = useCallback(() => {
        clearSuggestions(); clearResults();
        setShowDropdown(false); setHasSearched(false);
        setActiveFilters([]); setSortBy("relevance");
        router.push("/search", { scroll: false });
    }, [clearSuggestions, clearResults, router]);

    const handleFilterToggle = useCallback((filterId: string) => {
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

    return (
        <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
            <TopBar />
            <div className="mt-[60px] relative">
                <SearchBar
                    query={query}
                    onQueryChange={handleQueryChange}
                    onSubmit={handleSubmit}
                    onFocus={() => { if (query.length >= 2 || recentSearches.length > 0) setShowDropdown(true); }}
                    onClear={handleClear}
                    autoFocus={!urlQuery}
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

            {hasSearched && <FilterChips activeFilters={activeFilters} onToggle={handleFilterToggle} />}

            <main className="flex-1">
                {hasSearched && results.length === 0 && !loading ? (
                    <SearchEmptyState
                        query={query}
                        onSuggestionClick={handleSubmit}
                        onRequestClick={() => router.push("/requests/new")}
                    />
                ) : hasSearched ? (
                    <ResultsGrid
                        results={results}
                        loading={loading}
                        query={query}
                        totalCount={totalCount}
                        sortBy={sortBy}
                        onSortChange={handleSortChange}
                    />
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
