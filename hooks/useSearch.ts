"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSearchStore } from "@/stores/searchStore";
import { SearchSuggestion } from "@/stores/searchStore";
import { db } from "@/lib/firebase";
import {
  collection,
  query as firestoreQuery,
  where,
  getDocs,
  limit,
} from "firebase/firestore";

// ── useSuggestions ────────────────────────────────────────────────────────────
// Watches the search query in Zustand store, debounces 250ms, queries Firestore
// rentals in-memory-filtered for matching name/category.

export function useSuggestions() {
  const { query: searchText, setSuggestions, setStatus } = useSearchStore();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!searchText.trim()) {
      setStatus("idle");
      setSuggestions([]);
      return;
    }

    timerRef.current = setTimeout(async () => {
      setStatus("loading");

      try {
        if (!db) {
          setStatus("idle");
          return;
        }

        // The collection name is "rentals" and active items have status "available"
        const rentalsRef = collection(db as any, "rentals");

        const q = firestoreQuery(
          rentalsRef,
          where("status", "==", "available"),
          limit(80)
        );
        const snapshot = await getDocs(q);

        const lowerText = searchText.toLowerCase().trim();
        const results: SearchSuggestion[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          const itemName = (data.itemName || "").toLowerCase();
          const category = (
            data.categoryId ||
            data.category ||
            ""
          ).toLowerCase();

          if (itemName.includes(lowerText) || category.includes(lowerText)) {
            results.push({
              id: doc.id,
              name: data.itemName || "Unnamed Item",
              category: data.categoryId || data.category || "others",
              image: data.photoUrl || data.imageUrl || undefined,
              price: data.pricePerHour ?? data.price,
              distance: data.distance || data.block || undefined,
            });
          }
        });

        setSuggestions(results.slice(0, 8));
        setStatus("success");
      } catch (err: any) {
        console.error("[useSuggestions] Firestore error:", err);
        setStatus("error");
      }
    }, 250);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [searchText]); // eslint-disable-line react-hooks/exhaustive-deps
}

// ── useKeyboardNav ────────────────────────────────────────────────────────────
// Returns a handleKeyDown to attach to the search input for A11Y keyboard nav.

export function useKeyboardNav(itemCount: number) {
  const router = useRouter();
  const {
    activeIndex,
    setActiveIndex,
    suggestions,
    query: searchText,
    executeSearch,
    close,
  } = useSearchStore();

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
        } else if (searchText.trim()) {
          executeSearch(searchText, router);
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
