"use client";

import React, { useEffect, useRef } from "react";
import { useSearchStore } from "@/stores/searchStore";
import RecentList from "./RecentList";
import SuggestionList from "./SuggestionList";
import SearchSkeleton from "./SearchSkeleton";
import { AlertCircle, User, List, Settings, MapPin, Grid } from "lucide-react";
import { useRouter } from "next/navigation";

const QUICK_SUGGESTIONS = [
  { icon: User, label: "Profile", href: "/profile" },
  { icon: List, label: "My Listings", href: "/profile" },
  { icon: Settings, label: "Settings", href: "/profile" },
  { icon: MapPin, label: "Near You", href: "/near-you" },
];

const QUICK_CATEGORIES = [
  { label: "Rentals", href: "/rentals" },
  { label: "Buy & Sell", href: "/rentals" },
  { label: "Writing Services", href: "/writing" },
];

export default function SearchDropdownContent() {
  const router = useRouter();
  const {
    query,
    status,
    suggestions,
    activeIndex,
    close,
    isOpen,
    executeSearch,
  } = useSearchStore();

  const contentRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(e.target as Node)) {
        close();
      }
    };
    const t = setTimeout(() => document.addEventListener("mousedown", handler), 50);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", handler);
    };
  }, [isOpen, close]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, close]);

  const hasQuery = query.trim().length > 0;

  return (
    <div ref={contentRef} className="bg-white rounded-b-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Empty Query State: Command Center */}
      {!hasQuery && (
        <div className="py-2">
          <RecentList />
          <div className="h-px bg-gray-100 mx-4 my-2" />
          
          {/* Quick Suggestions */}
          <div className="px-4 pb-2">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Suggestions</h3>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_SUGGESTIONS.map((sug) => (
                <button
                  key={sug.label}
                  onClick={() => { close(); router.push(sug.href); }}
                  className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 transition-colors text-left"
                >
                  <sug.icon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-semibold">{sug.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-gray-100 mx-4 my-2" />

          {/* Quick Categories */}
          <div className="px-4 pb-2">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Categories</h3>
            <div className="flex flex-col gap-1">
              {QUICK_CATEGORIES.map((cat) => (
                <button
                  key={cat.label}
                  onClick={() => { close(); router.push(cat.href); }}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 text-gray-700 transition-colors text-left w-full"
                >
                  <div className="bg-indigo-50 p-1.5 rounded-lg text-indigo-600">
                    <Grid className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-semibold flex-1">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Loading: Skeleton */}
      {hasQuery && status === "loading" && <SearchSkeleton count={5} />}

      {/* Success with results */}
      {hasQuery && status === "success" && suggestions.length > 0 && (
        <div className="py-2">
          <div className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            {suggestions.length} result{suggestions.length !== 1 ? "s" : ""}
          </div>
          <SuggestionList
            items={suggestions}
            activeIndex={activeIndex}
            query={query}
          />
        </div>
      )}

      {/* Success with no results */}
      {hasQuery && status === "success" && suggestions.length === 0 && (
        <div className="py-12 text-center px-6">
          <div className="text-4xl mb-3">🔍</div>
          <div className="text-base font-bold text-gray-900 mb-1">
            No results for &ldquo;{query}&rdquo;
          </div>
          <div className="text-sm text-gray-500">
            Try searching for Calculator, Lab Coat, or Drafter
          </div>
        </div>
      )}

      {/* Error state */}
      {status === "error" && (
        <div className="p-4 flex items-center gap-2 text-red-500 text-sm">
          <AlertCircle className="w-4 h-4" />
          Something went wrong. Please try again.
        </div>
      )}
    </div>
  );
}
