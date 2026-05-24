"use client";

import React from "react";
import { Clock, X, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSearchStore } from "@/stores/searchStore";

export default function RecentList() {
  const router = useRouter();
  const { recentSearches, clearRecent, executeSearch } = useSearchStore();

  const handleDeleteOne = (id: string) => {
    const next = recentSearches.filter((r) => r.id !== id);
    useSearchStore.setState({ recentSearches: next });
    try {
      localStorage.setItem("iy_recent", JSON.stringify(next));
    } catch {}
  };

  return (
    <div className="py-2">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pb-1">
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "1.5px",
            color: "#94a3b8",
            textTransform: "uppercase",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Recent Searches
        </span>
        {recentSearches.length > 0 && (
          <button
            onClick={clearRecent}
            style={{
              fontSize: 11,
              color: "#5548E8",
              fontWeight: 600,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "2px 0",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Clear all
          </button>
        )}
      </div>

      {/* Rows */}
      {recentSearches.length === 0 ? (
        <div
          style={{
            padding: "12px 16px",
            fontSize: 13,
            color: "#94a3b8",
            fontFamily: "'DM Sans', sans-serif",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Search size={14} style={{ color: "#cbd5e1" }} />
          No recent searches
        </div>
      ) : (
        recentSearches.slice(0, 5).map((item) => (
          <div
            key={item.id}
            onClick={() => executeSearch(item.query, router)}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "10px 16px",
              cursor: "pointer",
              gap: 12,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f8faff")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <Clock size={15} style={{ color: "#94a3b8", flexShrink: 0 }} />
            <span
              style={{
                flex: 1,
                fontSize: 14,
                color: "#334155",
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 500,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {item.query}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteOne(item.id);
              }}
              style={{
                padding: 4,
                background: "none",
                border: "none",
                cursor: "pointer",
                borderRadius: 6,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={13} style={{ color: "#cbd5e1" }} />
            </button>
          </div>
        ))
      )}
    </div>
  );
}
