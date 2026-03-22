"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Listing, SearchFilter } from "@/lib/types";
import { db, auth } from "@/lib/firebase";
import { collection, query as firestoreQuery, where, getDocs, limit, orderBy, addDoc, serverTimestamp } from "firebase/firestore";

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

// ──────────────────────────────────────────
// Scoring function for suggestions
// ──────────────────────────────────────────
function scoreSuggestion(text: string, query: string): number {
    const lower = text.toLowerCase();
    const q = query.toLowerCase();
    if (lower === q) return 100;           // exact match
    if (lower.startsWith(q)) return 80;    // prefix match
    // Word-boundary match (e.g. "Scientific Calculator" matches "cal")
    const words = lower.split(/\s+/);
    for (const word of words) {
        if (word.startsWith(q)) return 60;
    }
    if (lower.includes(q)) return 30;      // contains match (lowest)
    return 0;
}

// ──────────────────────────────────────────
// useSuggestions — for autocomplete dropdown
// ──────────────────────────────────────────
export function useSuggestions(collegeId?: string) {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
    const [loading, setLoading] = useState(false);

    const debouncedQuery = useDebounce(query, 300);
    const abortRef = useRef<AbortController | null>(null);
    const cacheRef = useRef<Map<string, SearchSuggestion[]>>(new Map());

    useEffect(() => {
        const q = debouncedQuery.trim().toLowerCase();
        if (q.length < 2) {
            setSuggestions([]);
            return;
        }

        // Check cache first
        if (cacheRef.current.has(q)) {
            setSuggestions(cacheRef.current.get(q)!);
            return;
        }

        // Cancel previous request
        if (abortRef.current) abortRef.current.abort();
        abortRef.current = new AbortController();

        const fetchSuggestions = async () => {
            setLoading(true);
            try {
                // 1. Static matches (instant)
                const staticResults = COMMON_TERMS
                    .map(t => ({ ...t, score: scoreSuggestion(t.text, q) }))
                    .filter(t => t.score > 0)
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 6);

                // 2. DB matches (if we need more)
                let dbResults: SearchSuggestion[] = [];
                if (collegeId && staticResults.length < 6 && db) {
                    const rentalsRef = collection(db, "rentals");
                    const qRef = firestoreQuery(
                        rentalsRef,
                        where("collegeId", "==", collegeId),
                        where("status", "==", "available"),
                        limit(30)
                    );
                    const snapshot = await getDocs(qRef);
                    const seen = new Set(staticResults.map(s => s.text.toLowerCase()));

                    // Count occurrences for suggestions
                    const counts: Record<string, number> = {};
                    snapshot.docs.forEach(doc => {
                        const name = doc.data().itemName as string;
                        if (name) counts[name] = (counts[name] || 0) + 1;
                    });

                    snapshot.docs.forEach(doc => {
                        const data = doc.data();
                        const name = data.itemName as string;
                        if (!name) return;
                        const score = scoreSuggestion(name, q);
                        if (score > 0 && !seen.has(name.toLowerCase())) {
                            seen.add(name.toLowerCase());
                            dbResults.push({
                                text: name,
                                category: data.categoryId || "Items",
                                type: "product",
                                icon: "📦",
                                count: counts[name],
                                score
                            } as any);
                        }
                    });

                    dbResults.sort((a: any, b: any) => (b as any).score - (a as any).score);
                    dbResults = dbResults.slice(0, 6 - staticResults.length);
                }

                const combined = [...staticResults, ...dbResults].slice(0, 8);
                cacheRef.current.set(q, combined);
                setSuggestions(combined);
            } catch (err: any) {
                if (err?.name !== "AbortError") {
                    console.error("Suggestions error:", err);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchSuggestions();
    }, [debouncedQuery, collegeId]);

    const clearSuggestions = useCallback(() => {
        setQuery("");
        setSuggestions([]);
    }, []);

    return { query, setQuery, suggestions, loading, clearSuggestions };
}

// ──────────────────────────────────────────
// useSearchResults — for the /search page
// ──────────────────────────────────────────
export function useSearchResults(collegeId?: string, mode?: string) {
    const [results, setResults] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const abortRef = useRef<AbortController | null>(null);

    const search = useCallback(async (searchQuery: string, filters?: SearchFilter) => {
        const hasCategory = filters?.categoryId;
        if (!collegeId || (!searchQuery.trim() && !hasCategory)) {
            setResults([]);
            setTotalCount(0);
            return;
        }

        // Cancel previous
        if (abortRef.current) abortRef.current.abort();
        abortRef.current = new AbortController();

        setLoading(true);
        try {
            const activeMode = (filters as any)?.mode || "all";
            let url = `/api/search?q=${encodeURIComponent(searchQuery)}&collegeId=${collegeId}&mode=${activeMode}`;
            if (filters?.categoryId) {
                url += `&categoryId=${encodeURIComponent(filters.categoryId)}`;
            }
            if (filters?.maxPrice) {
                url += `&maxPrice=${filters.maxPrice}`;
            }

            const res = await fetch(url, { signal: abortRef.current.signal });
            const data = await res.json();

            setResults(data.results || []);
            setTotalCount(data.totalCount || 0);

            // Log successful search
            if (data.results?.length > 0 && searchQuery.length > 2) {
                const logsRef = collection(db!, "search_logs");
                addDoc(logsRef, {
                    query: searchQuery.toLowerCase(),
                    collegeId: collegeId,
                    userId: auth?.currentUser?.uid || null,
                    timestamp: serverTimestamp()
                }).catch(e => console.error("Logging error:", e));
            }
        } catch (err: any) {
            if (err?.name !== "AbortError") {
                console.error("Search error:", err);
            }
        } finally {
            setLoading(false);
        }
    }, [collegeId, mode]);

    const clearResults = useCallback(() => {
        setResults([]);
        setTotalCount(0);
    }, []);

    return { results, loading, totalCount, search, clearResults };
}

// ──────────────────────────────────────────
// useCategoryCounts — for "X available" badges
// ──────────────────────────────────────────
export function useCategoryCounts(collegeId?: string) {
    const [counts, setCounts] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!collegeId || !db) return;

        const fetchCounts = async () => {
            setLoading(true);
            try {
                const firestore = db!;
                const rentalsRef = collection(firestore, "rentals");
                const q = firestoreQuery(
                    rentalsRef,
                    where("collegeId", "==", collegeId),
                    where("status", "==", "available")
                );
                const snapshot = await getDocs(q);
                
                const newCounts: Record<string, number> = {};
                snapshot.docs.forEach(doc => {
                    const catId = doc.data().categoryId as string;
                    if (catId) {
                        newCounts[catId] = (newCounts[catId] || 0) + 1;
                    }
                });
                setCounts(newCounts);
            } catch (err) {
                console.error("Error fetching category counts:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchCounts();
    }, [collegeId]);

    return { counts, loading };
}
