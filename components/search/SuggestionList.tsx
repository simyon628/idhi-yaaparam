"use client";

import React, { memo } from "react";
import { Search, ArrowRight, IndianRupee, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { SearchSuggestion, useSearchStore } from "@/stores/searchStore";

// ── Highlight matching text ────────────────────────────────────────────────
function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const lower = text.toLowerCase();
  const lowerQ = query.toLowerCase().trim();
  const start = lower.indexOf(lowerQ);
  if (start === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, start)}
      <span style={{ fontWeight: 800, color: "#0B57D0" }}>
        {text.slice(start, start + lowerQ.length)}
      </span>
      {text.slice(start + lowerQ.length)}
    </>
  );
}

// Category color map
const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  calculator:   { bg: "#EEF0FF", text: "#5B6EF5" },
  drafter:      { bg: "#FFF4E5", text: "#D97706" },
  "lab-coat":   { bg: "#ECFDF5", text: "#059669" },
  laptop:       { bg: "#EFF6FF", text: "#2563EB" },
  books:        { bg: "#FFF7ED", text: "#EA580C" },
  electronics:  { bg: "#F0FDF4", text: "#16A34A" },
  accessories:  { bg: "#FDF2F8", text: "#9333EA" },
  hostel:       { bg: "#FAFAF0", text: "#84CC16" },
  others:       { bg: "#F1F5F9", text: "#64748B" },
};

function getCatStyle(cat: string) {
  return CATEGORY_COLORS[cat.toLowerCase()] || CATEGORY_COLORS.others;
}

// ── Single Result Row ──────────────────────────────────────────────────────
interface RowProps {
  item: SearchSuggestion;
  index: number;
  isActive: boolean;
  query: string;
  onSelect: (id: string, name: string) => void;
  onHover: (index: number) => void;
}

const SuggestionRow = memo(function SuggestionRow({
  item, index, isActive, query, onSelect, onHover,
}: RowProps) {
  const catStyle = getCatStyle(item.category);

  return (
    <div
      onClick={() => onSelect(item.id, item.name)}
      onMouseEnter={() => onHover(index)}
      style={{
        display: "flex",
        alignItems: "center",
        padding: "10px 16px",
        cursor: "pointer",
        gap: 12,
        background: isActive ? "#F0F7FF" : "transparent",
        borderLeft: isActive ? "3px solid #0B57D0" : "3px solid transparent",
        transition: "background 0.1s",
      }}
    >
      {/* Thumbnail */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: catStyle.bg,
          flexShrink: 0,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid rgba(0,0,0,0.04)",
        }}
      >
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <Search size={18} style={{ color: catStyle.text }} />
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            color: "#1e293b",
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 600,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          <HighlightMatch text={item.name} query={query} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
          {/* Category badge */}
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              padding: "2px 7px",
              borderRadius: 20,
              background: catStyle.bg,
              color: catStyle.text,
            }}
          >
            {item.category}
          </span>

          {/* Distance */}
          {item.distance && (
            <span style={{ fontSize: 11, color: "#94a3b8", display: "flex", alignItems: "center", gap: 2 }}>
              <MapPin size={9} /> {item.distance}
            </span>
          )}
        </div>
      </div>

      {/* Price */}
      {item.price !== undefined && item.price !== null && (
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{
            fontSize: 14,
            fontWeight: 800,
            color: "#10B981",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}>
            <IndianRupee size={11} strokeWidth={2.5} />
            {item.price}
          </div>
          <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>per hr</div>
        </div>
      )}

      {/* Arrow */}
      <ArrowRight size={14} style={{ color: "#CBD5E1", flexShrink: 0 }} />
    </div>
  );
});

// ── List ───────────────────────────────────────────────────────────────────
interface Props {
  items: SearchSuggestion[];
  activeIndex: number;
  query: string;
}

export default function SuggestionList({ items, activeIndex, query }: Props) {
  const router = useRouter();
  const { executeSearch, setActiveIndex } = useSearchStore();

  const handleSelect = (id: string, name: string) => {
    // Navigate to item detail if we have the ID, else search
    router.push(`/rentals/${id}`);
    useSearchStore.getState().close();
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
