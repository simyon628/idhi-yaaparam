"use client";

import React from "react";
import { Flame } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSearchStore } from "@/stores/searchStore";

const TRENDING = [
  { name: "Calculator", category: "Calculators", emoji: "🖩" },
  { name: "Lab Coat", category: "Lab Essentials", emoji: "🥼" },
  { name: "Drafter", category: "Drawing Tools", emoji: "📐" },
  { name: "Arduino Uno", category: "Electronics", emoji: "⚡" },
  { name: "Casio fx-991EX", category: "Calculators", emoji: "🔢" },
];

export default function TrendingList() {
  const router = useRouter();
  const { executeSearch } = useSearchStore();

  return (
    <div className="py-2">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pb-1">
        <Flame size={12} style={{ color: "#FF6B35" }} />
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
          Trending on Campus
        </span>
      </div>

      {/* Rows */}
      {TRENDING.map((item) => (
        <div
          key={item.name}
          onClick={() => executeSearch(item.name, router)}
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
          {/* Icon */}
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: "linear-gradient(135deg, #FFF4ED, #FFE8D6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            {item.emoji}
          </div>

          {/* Name */}
          <span
            style={{
              flex: 1,
              fontSize: 14,
              color: "#1e293b",
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600,
            }}
          >
            {item.name}
          </span>

          {/* Category Tag */}
          <span
            style={{
              fontSize: 10,
              color: "#64748b",
              background: "#f1f5f9",
              borderRadius: 20,
              padding: "3px 8px",
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            {item.category}
          </span>
        </div>
      ))}
    </div>
  );
}
