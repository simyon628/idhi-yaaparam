"use client";

import React, { memo } from "react";
import { TrendingUp, ArrowUpRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSearchStore } from "@/stores/searchStore";

const TRENDING = [
  { name: "Scientific Calculator", category: "Calculators", emoji: "🖩", slug: "calculator" },
  { name: "Lab Coat", category: "Lab Essentials", emoji: "🥼", slug: "lab-coat" },
  { name: "Engineering Drafter", category: "Drawing Tools", emoji: "📐", slug: "drafter" },
  { name: "MacBook Laptop", category: "Laptops", emoji: "💻", slug: "laptop" },
  { name: "Arduino Kit", category: "Electronics", emoji: "⚡", slug: "electronics" },
  { name: "GATE Books", category: "Books", emoji: "📚", slug: "books" },
];

const CATEGORIES = [
  { label: "Calculators", emoji: "🖩", slug: "calculator" },
  { label: "Drafters", emoji: "📐", slug: "drafter" },
  { label: "Lab Coat", emoji: "🥼", slug: "lab-coat" },
  { label: "Laptops", emoji: "💻", slug: "laptop" },
  { label: "Books", emoji: "📚", slug: "books" },
  { label: "Electronics", emoji: "⚡", slug: "electronics" },
];

export default function TrendingList() {
  const router = useRouter();
  const { executeSearch, close } = useSearchStore();

  return (
    <div>
      {/* Quick Category Pills */}
      <div style={{ padding: "12px 16px 4px" }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 10 }}>
          Browse Categories
        </div>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 4 }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => { close(); router.push(`/category/${cat.slug}`); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 12px",
                background: "#F0F7FF",
                border: "1px solid #BFDBFE",
                borderRadius: 20,
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#0B57D0";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#0B57D0";
                const spans = (e.currentTarget as HTMLButtonElement).querySelectorAll("span");
                spans.forEach(s => (s as HTMLElement).style.color = "#fff");
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#F0F7FF";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#BFDBFE";
                const spans = (e.currentTarget as HTMLButtonElement).querySelectorAll("span");
                spans[0] && ((spans[0] as HTMLElement).style.color = "inherit");
                spans[1] && ((spans[1] as HTMLElement).style.color = "#0B57D0");
              }}
            >
              <span style={{ fontSize: 14 }}>{cat.emoji}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#0B57D0", fontFamily: "'DM Sans', sans-serif" }}>
                {cat.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "#F1F5F9", margin: "8px 0" }} />

      {/* Trending Searches */}
      <div style={{ padding: "4px 16px 8px" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 6, marginBottom: 8
        }}>
          <TrendingUp size={12} style={{ color: "#F59E0B" }} />
          <span style={{
            fontSize: 10, fontWeight: 800, color: "#94a3b8",
            textTransform: "uppercase", letterSpacing: "1.5px",
          }}>
            Trending on Campus
          </span>
        </div>

        {TRENDING.map((item) => (
          <div
            key={item.name}
            onClick={() => executeSearch(item.name, router)}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "9px 0",
              cursor: "pointer",
              gap: 12,
              borderBottom: "1px solid #F8FAFC",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = "#F8FAFF")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}
          >
            {/* Emoji bubble */}
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg, #FFF4ED, #FFE8D6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              flexShrink: 0,
            }}>
              {item.emoji}
            </div>

            {/* Text */}
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 14, color: "#1e293b",
                fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
              }}>
                {item.name}
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>
                {item.category}
              </div>
            </div>

            {/* Arrow */}
            <ArrowUpRight size={14} style={{ color: "#CBD5E1" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
