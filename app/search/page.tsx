"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { useCollege } from "@/contexts/CollegeContext";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Listing } from "@/lib/types";
import { Search, ArrowLeft, Package } from "lucide-react";
import { useRouter as useNav } from "next/navigation";
import { ProductCard } from "@/components/ui/ProductCard";

const MOCK_PRODUCTS = [
  { id: "p_001", itemName: "Calculator", category: "calculator", icon: "🖩", pricePerHour: 10, block: "Block A", condition: "Good" },
  { id: "p_002", itemName: "Casio fx-991EX", category: "calculator", icon: "🔢", pricePerHour: 15, block: "Block B", condition: "Excellent" },
  { id: "p_003", itemName: "Casio fx-991MS", category: "calculator", icon: "🔢", pricePerHour: 12, block: "Block A", condition: "Good" },
  { id: "p_004", itemName: "Casio fx-82MS", category: "calculator", icon: "🔢", pricePerHour: 8, block: "Block C", condition: "Fair" },
  { id: "p_005", itemName: "Lab Coat", category: "lab-coat", icon: "🥼", pricePerHour: 20, block: "Block D", condition: "Good" },
  { id: "p_006", itemName: "Lab Gloves", category: "lab-coat", icon: "🧤", pricePerHour: 5, block: "Block D", condition: "New" },
  { id: "p_007", itemName: "Lab Goggles", category: "lab-coat", icon: "🥽", pricePerHour: 5, block: "Block D", condition: "Good" },
  { id: "p_008", itemName: "Drafter", category: "drafter", icon: "📐", pricePerHour: 25, block: "Block E", condition: "Excellent" },
  { id: "p_009", itemName: "Drawing Board", category: "drafter", icon: "📋", pricePerHour: 15, block: "Block E", condition: "Good" },
  { id: "p_010", itemName: "Set Square", category: "geometry", icon: "📐", pricePerHour: 5, block: "Block E", condition: "Good" },
  { id: "p_011", itemName: "Compass Box", category: "geometry", icon: "✏️", pricePerHour: 10, block: "Block E", condition: "Good" },
  { id: "p_012", itemName: "Protractor", category: "geometry", icon: "📏", pricePerHour: 3, block: "Block E", condition: "Good" },
  { id: "p_013", itemName: "Arduino Uno", category: "electronics", icon: "⚡", pricePerHour: 30, block: "Lab 1", condition: "Excellent" },
  { id: "p_014", itemName: "Arduino Nano", category: "electronics", icon: "⚡", pricePerHour: 20, block: "Lab 1", condition: "Good" },
  { id: "p_015", itemName: "Breadboard", category: "electronics", icon: "🔌", pricePerHour: 5, block: "Lab 1", condition: "Good" },
  { id: "p_016", itemName: "Multimeter", category: "electronics", icon: "📟", pricePerHour: 15, block: "Lab 2", condition: "Good" },
  { id: "p_017", itemName: "Soldering Iron", category: "electronics", icon: "🔥", pricePerHour: 10, block: "Lab 2", condition: "Good" },
  { id: "p_018", itemName: "Resistor Kit", category: "electronics", icon: "📦", pricePerHour: 5, block: "Lab 2", condition: "New" },
  { id: "p_019", itemName: "Stethoscope", category: "others", icon: "🩺", pricePerHour: 50, block: "Block F", condition: "Good" },
  { id: "p_020", itemName: "Survey Instruments", category: "others", icon: "🗺️", pricePerHour: 100, block: "Block F", condition: "Good" },
];

function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "";
  const { selectedCollege } = useCollege();

  const [results, setResults] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    
    // Simulate network delay
    const timer = setTimeout(() => {
      let filtered = MOCK_PRODUCTS;
      
      if (category) {
        filtered = filtered.filter(p => p.category === category);
      }
      
      if (q) {
        const lowerQ = q.toLowerCase();
        filtered = filtered.filter(p => 
          p.itemName.toLowerCase().includes(lowerQ)
        );
      }
      
      setResults(filtered as any);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [q, category]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        paddingBottom: 96,
        background: "var(--iy-surface, #f8faff)",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <TopBar />

      {/* Results header */}
      <div
        style={{
          padding: "16px 20px 12px",
          background: "#fff",
          borderBottom: "1px solid #f1f5f9",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <button
          onClick={() => router.back()}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
        >
          <ArrowLeft size={20} style={{ color: "#64748b" }} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>
            Results for &ldquo;<span style={{ color: "#5548E8" }}>{q}</span>&rdquo;
          </div>
          {!loading && (
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
              {results.length} listing{results.length !== 1 ? "s" : ""} found
            </div>
          )}
        </div>
      </div>

      {/* Category Filter Pills */}
      <div 
        style={{ 
          display: "flex", 
          gap: 8, 
          overflowX: "auto", 
          padding: "12px 20px", 
          background: "#fff", 
          borderBottom: "1px solid #f1f5f9",
          scrollbarWidth: "none",
        }}
      >
        {["all", "calculator", "lab-coat", "drafter", "geometry", "electronics", "others"].map((cat) => (
          <button
            key={cat}
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              if (cat === "all") params.delete("category");
              else params.set("category", cat);
              router.push(`/search?${params.toString()}`);
            }}
            style={{
              padding: "6px 14px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              background: (category === cat || (!category && cat === "all")) ? "linear-gradient(135deg,#5548E8,#7B72FF)" : "#f1f5f9",
              color: (category === cat || (!category && cat === "all")) ? "#fff" : "#64748b",
              border: "none",
              cursor: "pointer",
              whiteSpace: "nowrap",
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: (category === cat || (!category && cat === "all")) ? "0 2px 8px rgba(85,72,232,0.25)" : "none",
            }}
          >
            {cat === "all" ? "All" : cat.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: 16, flex: 1 }}>
        {loading ? (
          /* Loading skeletons */
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                style={{
                  background: "#fff",
                  borderRadius: 20,
                  height: 90,
                  animation: "pulse 1.5s ease-in-out infinite",
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        ) : results.length === 0 ? (
          /* Empty state */
          <div style={{ textAlign: "center", padding: "60px 24px" }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🔍</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>
              Nothing found for &ldquo;{q}&rdquo;
            </div>
            <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>
              Try a different search term or browse categories below.
            </div>
            <button
              onClick={() => router.push("/rentals")}
              style={{
                marginTop: 24,
                padding: "12px 28px",
                background: "linear-gradient(135deg,#5548E8,#7B72FF)",
                color: "#fff",
                border: "none",
                borderRadius: 14,
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 6px 20px rgba(85,72,232,0.35)",
              }}
            >
              Browse All Items
            </button>
          </div>
        ) : (
          /* Results grid */
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, justifyItems: "center" }}>
            {results.map((item: any) => (
              <div key={item.id} onClick={() => router.push(`/rentals/${item.id}`)} style={{ cursor: "pointer", width: "100%", display: "flex", justifyContent: "center" }}>
                <ProductCard 
                  id={item.id}
                  itemName={item.itemName}
                  pricePerHour={item.pricePerHour}
                  category={item.category}
                  imageUrl={
                    item.category === "calculator" ? "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&q=80" :
                    item.category === "drafter" ? "https://images.unsplash.com/photo-1503387837-b154d5074bd2?w=400&q=80" :
                    item.category === "lab-coat" ? "https://images.unsplash.com/photo-1581591524425-c7e0978865fc?w=400&q=80" :
                    "https://images.unsplash.com/photo-1434030216411-0bb793f49412?w=400&q=80"
                  }
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
      `}</style>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchResults />
    </Suspense>
  );
}
