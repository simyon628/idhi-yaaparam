"use client";

import { useState, useCallback } from "react";

const STORAGE_KEY = "iy_recent_searches";
const MAX_ITEMS = 5;

export function useSearchHistory() {
    const [recentSearches, setRecentSearches] = useState<string[]>(() => {
        if (typeof window === "undefined") return [];
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        } catch {
            return [];
        }
    });

    const saveSearch = useCallback((query: string) => {
        const trimmed = query.trim();
        if (!trimmed) return;
        const updated = [trimmed, ...recentSearches.filter(q => q !== trimmed)].slice(0, MAX_ITEMS);
        setRecentSearches(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }, [recentSearches]);

    const removeSearch = useCallback((query: string) => {
        const updated = recentSearches.filter(q => q !== query);
        setRecentSearches(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }, [recentSearches]);

    const clearHistory = useCallback(() => {
        setRecentSearches([]);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    return { recentSearches, saveSearch, removeSearch, clearHistory };
}
