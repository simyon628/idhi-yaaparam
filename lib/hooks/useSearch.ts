import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Listing, SearchFilter } from "@/lib/types";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAllItems } from "./useAllItems";

// ──────────────────────────────────────────
// Types
// ──────────────────────────────────────────
export interface SearchSuggestion {
    text: string;
    category: string;
    type: "product" | "category" | "trending";
    icon: string;
    count?: number;
}

// ──────────────────────────────────────────
// useDebounce — generic debounce hook
// ──────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debouncedValue;
}

// ──────────────────────────────────────────
// Static suggestion terms (instant, no API)
// ──────────────────────────────────────────
const COMMON_TERMS: SearchSuggestion[] = [
    { text: "Calculator", category: "Calculators", type: "product", icon: "🔢" },
    { text: "Casio fx991", category: "Calculators", type: "product", icon: "🔢" },
    { text: "Scientific Calculator", category: "Calculators", type: "product", icon: "🔢" },
    { text: "Drafter", category: "Lab Gear", type: "product", icon: "📏" },
    { text: "Lab Coat", category: "Lab Gear", type: "product", icon: "🧥" },
    { text: "Arduino", category: "Electronics", type: "product", icon: "🔋" },
    { text: "Cycle", category: "Transport", type: "product", icon: "🚲" },
    { text: "Books", category: "Books & Notes", type: "category", icon: "📘" },
    { text: "Lab Record", category: "Stationery", type: "product", icon: "📓" },
    { text: "Breadboard", category: "Electronics", type: "product", icon: "🔌" },
];

/**
 * useSuggestions — for autocomplete dropdown
 */
export function useSuggestions(collegeId?: string) {
    const [query, setQuery] = useState("");
    const { data: allItems = [] } = useAllItems(collegeId);

    const suggestions = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (q.length < 2) return [];

        // 1. Static matches
        const staticResults = COMMON_TERMS
            .filter(t => t.text.toLowerCase().includes(q) || t.category.toLowerCase().includes(q))
            .slice(0, 4);

        // 2. DB matches from cache
        const dbMatches = allItems
            .filter(item => item.itemName.toLowerCase().includes(q))
            .map(item => ({
                text: item.itemName,
                category: item.categoryId || "Items",
                type: "product" as const,
                icon: item.icon || "📦"
            }))
            .filter((v, i, a) => a.findIndex(t => t.text === v.text) === i) // Unique
            .slice(0, 4);

        return [...staticResults, ...dbMatches].slice(0, 8);
    }, [query, allItems]);

    const clearSuggestions = useCallback(() => setQuery(""), []);

    return { query, setQuery, suggestions, loading: false, clearSuggestions };
}

/**
 * useSearchResults — Reactive in-memory search
 */
export function useSearchResults({ q, categoryId, mode, collegeId }: {
    q: string;
    categoryId?: string;
    mode?: string;
    collegeId?: string;
}) {
    const { data: allItems = [], isLoading, error } = useAllItems(collegeId);

    const results = useMemo(() => {
        let filtered = [...allItems];

        // 1. Filter by category
        if (categoryId) {
            filtered = filtered.filter(item => item.categoryId === categoryId);
        }

        // 2. Filter by listing mode
        if (mode && mode !== "all") {
            filtered = filtered.filter(item => item.listingType === mode);
        }

        // 3. Filter by text search
        if (q && q.trim().length > 0) {
            const searchTerms = q.toLowerCase().trim().split(/\s+/);
            filtered = filtered.filter(item => {
                const text = [
                    item.itemName || '',
                    item.categoryId || '',
                    item.block || '',
                    item.college || '',
                    item.department || ''
                ].join(' ').toLowerCase();
                return searchTerms.every(term => text.includes(term));
            });
        }

        return filtered;
    }, [allItems, q, categoryId, mode]);

    // Async logging (non-blocking)
    useEffect(() => {
        if (q.length > 2 && results.length > 0 && db && collegeId) {
            const logsRef = collection(db, "search_logs");
            addDoc(logsRef, {
                query: q.toLowerCase(),
                collegeId: collegeId,
                resultsCount: results.length,
                timestamp: serverTimestamp()
            }).catch(() => {});
        }
    }, [q, results.length > 0, collegeId]);

    return { 
        results, 
        isLoading, 
        totalCount: results.length,
        error
    };
}

/**
 * useCategoryCounts — Reactive counts from cache
 */
export function useCategoryCounts(collegeId?: string) {
    const { data: allItems = [], isLoading } = useAllItems(collegeId);

    const counts = useMemo(() => {
        const newCounts: Record<string, number> = {};
        allItems.forEach(item => {
            const catId = item.categoryId;
            if (catId) {
                newCounts[catId] = (newCounts[catId] || 0) + 1;
            }
        });
        return newCounts;
    }, [allItems]);

    return { counts, loading: isLoading };
}
