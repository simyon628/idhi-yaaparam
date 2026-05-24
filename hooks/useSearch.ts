"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSearchStore } from "@/stores/searchStore";
import { SearchSuggestion } from "@/stores/searchStore";

// ── useSuggestions ────────────────────────────────────────────────────────────
// Watches query in store, debounces 250ms, fetches /api/v1/suggestions

export function useSuggestions() {
  const { query, setSuggestions, setStatus } = useSearchStore();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Clear previous timer & abort previous fetch
    if (timerRef.current) clearTimeout(timerRef.current);
    if (controllerRef.current) controllerRef.current.abort();

    if (!query.trim()) {
      setStatus("idle");
      setSuggestions([]);
      return;
    }

    // Debounce 150ms
    timerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      controllerRef.current = controller;

      setStatus("loading");

      try {
        const res = await fetch(
          `/api/v1/suggestions?q=${encodeURIComponent(query)}&limit=8`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const suggestions: SearchSuggestion[] = data.suggestions ?? [];
        setSuggestions(suggestions);
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          setStatus("error");
        }
      }
    }, 250);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (controllerRef.current) controllerRef.current.abort();
    };
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps
}

// ── useKeyboardNav ────────────────────────────────────────────────────────────
// Returns a handleKeyDown to attach to the search input

export function useKeyboardNav(itemCount: number) {
  const router = useRouter();
  const { activeIndex, setActiveIndex, suggestions, query, executeSearch, close } =
    useSearchStore();

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex(Math.min(activeIndex + 1, itemCount - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex(Math.max(activeIndex - 1, -1));
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && suggestions[activeIndex]) {
          executeSearch(suggestions[activeIndex].name, router);
        } else if (query.trim()) {
          executeSearch(query, router);
        }
        break;
      case "Escape":
        e.preventDefault();
        close();
        break;
    }
  }

  return handleKeyDown;
}
