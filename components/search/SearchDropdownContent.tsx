"use client";

import React, { useEffect, useRef } from "react";
import { useSearchStore } from "@/stores/searchStore";
import RecentList from "./RecentList";
import TrendingList from "./TrendingList";
import SuggestionList from "./SuggestionList";
import SearchSkeleton from "./SearchSkeleton";
import { AlertCircle } from "lucide-react";

export default function SearchDropdownContent() {
  const {
    query,
    status,
    suggestions,
    activeIndex,
    close,
    isOpen,
  } = useSearchStore();

  const contentRef = useRef<HTMLDivElement>(null);

  // ── Close on click outside ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(e.target as Node)) {
        close();
      }
    };
    // Delay to avoid closing on the same click that opened
    const t = setTimeout(() => document.addEventListener("mousedown", handler), 50);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", handler);
    };
  }, [isOpen, close]);

  // ── Close on Escape ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, close]);

  // ── Close on scroll (Zepto pattern) ──────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    let ticking = false;
    const handler = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          close();
          ticking = false;
        });
      }
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [isOpen, close]);

  // ── State machine render ──────────────────────────────────────────────────
  const hasQuery = query.trim().length > 0;

  return (
    <div ref={contentRef}>
      {/* Empty Query State: Recent + Trending */}
      {!hasQuery && (
        <>
          <RecentList />
          <div style={{ height: 1, background: "#f1f5f9", margin: "0 16px" }} />
          <TrendingList />
        </>
      )}

      {/* Loading: Skeleton */}
      {hasQuery && status === "loading" && <SearchSkeleton count={5} />}

      {/* Success with results */}
      {hasQuery && status === "success" && suggestions.length > 0 && (
        <>
          {/* Results count hint */}
          <div
            style={{
              padding: "8px 16px 4px",
              fontSize: 10,
              fontWeight: 700,
              color: "#94a3b8",
              letterSpacing: "1.2px",
              textTransform: "uppercase",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {suggestions.length} result{suggestions.length !== 1 ? "s" : ""}
          </div>
          <SuggestionList
            items={suggestions}
            activeIndex={activeIndex}
            query={query}
          />
        </>
      )}

      {/* Success with no results */}
      {hasQuery && status === "success" && suggestions.length === 0 && (
        <div
          style={{
            padding: "32px 24px",
            textAlign: "center",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#1e293b",
              marginBottom: 6,
            }}
          >
            No results for &ldquo;{query}&rdquo;
          </div>
          <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>
            Try searching for Calculator, Lab Coat, or Drafter
          </div>
        </div>
      )}

      {/* Error state */}
      {status === "error" && (
        <div
          style={{
            padding: "24px 16px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            color: "#ef4444",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
          }}
        >
          <AlertCircle size={16} />
          Something went wrong. Please try again.
        </div>
      )}

      {/* Bottom padding for mobile keyboard */}
      <div style={{ height: 8 }} />
    </div>
  );
}
