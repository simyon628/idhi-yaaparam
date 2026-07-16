"use client";

import React, { memo } from "react";
import { Search, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { SearchSuggestion, useSearchStore } from "@/stores/searchStore";

interface SuggestionRowProps {
  item: SearchSuggestion;
  index: number;
  isActive: boolean;
  query: string;
  onSelect: (name: string) => void;
  onHover: (index: number) => void;
}

// ── Highlight matching chars ──────────────────────────────────────────────────

function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase().trim();
  const start = lowerText.indexOf(lowerQuery);
  if (start === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, start)}
      <span style={{ fontWeight: 700, color: "#1e293b" }}>
        {text.slice(start, start + lowerQuery.length)}
      </span>
      {text.slice(start + lowerQuery.length)}
    </>
  );
}

// ── Row ───────────────────────────────────────────────────────────────────────

const SuggestionRow = memo(function SuggestionRow({
  item,
  index,
  isActive,
  query,
  onSelect,
  onHover,
}: SuggestionRowProps) {
  return (
    <div
      onClick={() => onSelect(item.name)}
      onMouseEnter={() => onHover(index)}
      style={{
        display: "flex",
        alignItems: "center",
        padding: "11px 16px",
        cursor: "pointer",
        gap: 12,
        background: isActive ? "#f8faff" : "transparent",
        transition: "background 0.1s",
        borderLeft: isActive ? "3px solid #0B57D0" : "3px solid transparent",
      }}
    >
      {/* Icon / Image */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: isActive ? "#EEE9FF" : "#f1f5f9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "background 0.1s",
          overflow: "hidden"
        }}
      >
        {item.image ? (
          <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <Search size={16} style={{ color: isActive ? "#0B57D0" : "#94a3b8" }} />
        )}
      </div>

      {/* Name and Category */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <span
          style={{
            fontSize: 14,
            color: "#334155",
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 600,
          }}
        >
          <HighlightMatch text={item.name} query={query} />
        </span>
        <span
          style={{
            fontSize: 12,
            color: "#94a3b8",
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 500,
            marginTop: 2,
          }}
        >
          {item.category} {item.distance ? `• ${item.distance} km` : ""}
        </span>
      </div>

      {/* Price */}
      {item.price !== undefined && (
        <div style={{ fontSize: 13, fontWeight: 700, color: "#10B981" }}>
          ₹{item.price}/hr
        </div>
      )}

      {/* Arrow */}
      <ArrowRight size={14} style={{ color: "#cbd5e1", marginLeft: 4 }} />
    </div>
  );
});

// ── List ──────────────────────────────────────────────────────────────────────

interface SuggestionListProps {
  items: SearchSuggestion[];
  activeIndex: number;
  query: string;
}

export default function SuggestionList({ items, activeIndex, query }: SuggestionListProps) {
  const router = useRouter();
  const { executeSearch, setActiveIndex } = useSearchStore();

  const handleSelect = (name: string) => {
    executeSearch(name, router);
  };

  return (
    <div>
      {items.map((item, i) => (
        <SuggestionRow
          key={item.id}
          item={item}
          index={i}
          isActive={i === activeIndex}
          query={query}
          onSelect={handleSelect}
          onHover={setActiveIndex}
        />
      ))}
    </div>
  );
}
