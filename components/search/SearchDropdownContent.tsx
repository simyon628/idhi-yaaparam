"use client";

import React, { useEffect, useRef } from "react";
import { useSearchStore } from "@/stores/searchStore";
import { useRouter } from "next/navigation";
import { Clock, X, Search, AlertCircle } from "lucide-react";
import SuggestionList from "./SuggestionList";
import TrendingList from "./TrendingList";

// ── Skeleton row ───────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px" }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: "#F1F5F9", flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: 14, background: "#F1F5F9", borderRadius: 6, marginBottom: 8, width: "70%" }} />
        <div style={{ height: 10, background: "#F1F5F9", borderRadius: 6, width: "40%" }} />
      </div>
      <div style={{ width: 40, height: 36, background: "#F1F5F9", borderRadius: 8 }} />
    </div>
  );
}

export default function SearchDropdownContent() {
  const router = useRouter();
  const {
    query,
    status,
    suggestions,
    activeIndex,
    recentSearches,
    close,
    isOpen,
    executeSearch,
    addRecent,
    clearRecent,
  } = useSearchStore();

  const contentRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(e.target as Node)) {
        close();
      }
    };
    const t = setTimeout(() => document.addEventListener("mousedown", handler), 50);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", handler); };
  }, [isOpen, close]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, close]);

  const hasQuery = query.trim().length > 0;
  const hasRecents = recentSearches.length > 0;

  return (
    <div ref={contentRef} style={{ background: "#fff", borderRadius: "0 0 20px 20px", overflow: "hidden" }}>

      {/* ── EMPTY QUERY STATE: Recents + Trending ── */}
      {!hasQuery && (
        <>
          {/* Recent Searches */}
          {hasRecents && (
            <div>
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 16px 6px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Clock size={11} style={{ color: "#94a3b8" }} />
                  <span style={{ fontSize: 10, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1.5px" }}>
                    Recent Searches
                  </span>
                </div>
                <button
                  onClick={clearRecent}
                  style={{ fontSize: 11, color: "#0B57D0", fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}
                >
                  Clear all
                </button>
              </div>

              {recentSearches.slice(0, 5).map((r) => (
                <div
                  key={r.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "9px 16px", cursor: "pointer",
                  }}
                  onClick={() => executeSearch(r.query, router)}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = "#F8FAFF")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 10, background: "#F1F5F9",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <Clock size={14} style={{ color: "#94a3b8" }} />
                  </div>
                  <span style={{ flex: 1, fontSize: 14, color: "#334155", fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>
                    {r.query}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Remove just this item
                      const next = recentSearches.filter((x) => x.id !== r.id);
                      useSearchStore.setState({ recentSearches: next });
                    }}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}
                  >
                    <X size={12} style={{ color: "#CBD5E1" }} />
                  </button>
                </div>
              ))}

              <div style={{ height: 1, background: "#F1F5F9", margin: "4px 0" }} />
            </div>
          )}

          {/* Trending + Categories */}
          <TrendingList />
        </>
      )}

      {/* ── LOADING: Skeleton rows ── */}
      {hasQuery && status === "loading" && (
        <div>
          {[1, 2, 3, 4].map((i) => <SkeletonRow key={i} />)}
        </div>
      )}

      {/* ── SUCCESS: Results ── */}
      {hasQuery && status === "success" && suggestions.length > 0 && (
        <div>
          {/* Results header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 16px 4px",
          }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1.5px" }}>
              {suggestions.length} result{suggestions.length !== 1 ? "s" : ""}
            </span>
            <button
              onClick={() => executeSearch(query, router)}
              style={{
                fontSize: 11, fontWeight: 700, color: "#0B57D0",
                background: "none", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 3,
              }}
            >
              See all <Search size={10} />
            </button>
          </div>

          <SuggestionList items={suggestions} activeIndex={activeIndex} query={query} />

          {/* Search all footer */}
          <div
            onClick={() => executeSearch(query, router)}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "12px 16px",
              cursor: "pointer",
              background: "#F8FAFF",
              borderTop: "1px solid #EEF2FF",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = "#EEF2FF")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "#F8FAFF")}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg, #0B57D0, #1A73E8)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Search size={16} style={{ color: "#fff" }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0B57D0", fontFamily: "'DM Sans', sans-serif" }}>
                Search for &ldquo;{query}&rdquo;
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>See all matching rentals</div>
            </div>
          </div>
        </div>
      )}

      {/* ── NO RESULTS ── */}
      {hasQuery && status === "success" && suggestions.length === 0 && (
        <div style={{ padding: "32px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginBottom: 6, fontFamily: "'Syne', sans-serif" }}>
            No results for &ldquo;{query}&rdquo;
          </div>
          <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20, lineHeight: 1.5 }}>
            Try searching for Calculator, Lab Coat, Drafter or Books
          </div>
          <button
            onClick={() => executeSearch(query, router)}
            style={{
              background: "linear-gradient(135deg, #0B57D0, #1A73E8)",
              color: "#fff", border: "none", borderRadius: 12,
              padding: "10px 24px", fontSize: 13, fontWeight: 700,
              cursor: "pointer", boxShadow: "0 4px 12px rgba(11,87,208,0.25)",
            }}
          >
            Search anyway →
          </button>
        </div>
      )}

      {/* ── ERROR ── */}
      {status === "error" && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 16px", color: "#EF4444", fontSize: 13 }}>
          <AlertCircle size={16} />
          Something went wrong. Please try again.
        </div>
      )}
    </div>
  );
}
