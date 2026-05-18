"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, SlidersHorizontal } from "lucide-react";
import { ProductCard } from "@/components/ui/ProductCard";
import { SkeletonCard } from "@/components/ui/SkeletonCard";

// Mock Data for Category Page
const MOCK_DATA = [
  { id: "c1", itemName: "Scientific Calculator Casio", pricePerHour: 15, category: "calculator", branch: "CSE", distance: "0.2 km", rating: 4.8, sellerUsername: "rahul_svec" },
  { id: "c2", itemName: "Basic Calculator", pricePerHour: 5, category: "calculator", branch: "Mech", distance: "0.5 km", rating: 4.2, sellerUsername: "priya_svec" },
  { id: "d1", itemName: "Engineering Drafter", pricePerHour: 25, category: "drafter", branch: "Civil", distance: "1.2 km", rating: 4.5, sellerUsername: "vikas_svec" },
  { id: "d2", itemName: "Mini Drafter", pricePerHour: 20, category: "drafter", branch: "Mech", distance: "0.4 km", rating: 4.9, sellerUsername: "anil_svec" },
  { id: "l1", itemName: "Lab Coat White L", pricePerHour: 20, category: "lab-coat", branch: "Bio", distance: "0.1 km", rating: 4.0, sellerUsername: "sita_svec" },
];

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const { slug } = React.use(params);
  const [sortBy, setSortBy] = useState("nearest");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const slugToCategoryMap: { [key: string]: string } = {
    'calculator': 'calculator',
    'drafter': 'drafter',
    'lab-coat': 'lab-coat',
    'laptop': 'laptop',
    'camera': 'camera',
    'geometry': 'geometry',
  };

  useEffect(() => {
    setIsLoading(true);
    setError("");
    // Simulate fetching products by category
    const timer = setTimeout(() => {
      try {
        const categoryValue = slugToCategoryMap[slug];
        if (!categoryValue && slug !== "electronics" && slug !== "academic") {
          setError("Category not found");
        }
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading items:', err);
        setError("Could not load items. Please try again.");
        setIsLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [slug]);

  const categoryItems = MOCK_DATA.filter(item => item.category === slug || slug === "electronics" || slug === "academic");
  const displayTitle = slug ? slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : "Category";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        background: "#f1f5f9",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Top Sticky Section */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, background: "#fff", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", color: "#1e293b" }}>
              <ArrowLeft size={24} />
            </button>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>{displayTitle}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Search size={20} color="#1e293b" />
            <button onClick={() => router.push(`/list-item?category=${slug}`)} style={{ background: "none", border: "none", fontSize: 24, fontWeight: 300, cursor: "pointer", color: "#1e293b" }}>
              +
            </button>
          </div>
        </div>

        {/* Filter/Sort Row */}
        <div style={{ display: "flex", alignItems: "center", padding: "8px 20px 12px", gap: 12, overflowX: "auto", scrollbarWidth: "none", borderBottom: "1px solid #e2e8f0" }}>
          <button style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff", fontSize: 13, fontWeight: 600, color: "#334155", flexShrink: 0 }}>
            <SlidersHorizontal size={14} /> Filter
          </button>
          
          {[
            { id: "nearest", label: "Nearest" },
            { id: "price_asc", label: "Price ↑" },
            { id: "price_desc", label: "Price ↓" },
            { id: "rating", label: "Rating" }
          ].map(sort => (
            <button
              key={sort.id}
              onClick={() => setSortBy(sort.id)}
              style={{
                padding: "6px 12px",
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: "nowrap",
                border: sortBy === sort.id ? "1px solid #5B4CDB" : "1px solid #cbd5e1",
                background: sortBy === sort.id ? "#EEF0FF" : "#fff",
                color: sortBy === sort.id ? "#5B4CDB" : "#334155",
                cursor: "pointer",
                flexShrink: 0
              }}
            >
              {sort.label}
            </button>
          ))}
        </div>

        {/* Brand Filter Chips */}
        <div style={{ display: "flex", gap: 8, padding: "8px 20px", overflowX: "auto", scrollbarWidth: "none", background: "#f8fafc" }}>
          {["All", "Casio", "Texas Instruments", "Nataraj", "Staedtler"].map(brand => (
            <button
              key={brand}
              style={{
                padding: "4px 12px",
                borderRadius: 16,
                fontSize: 12,
                fontWeight: 600,
                whiteSpace: "nowrap",
                border: "1px solid #e2e8f0",
                background: brand === "All" ? "#1e293b" : "#fff",
                color: brand === "All" ? "#fff" : "#64748b",
                cursor: "pointer",
                flexShrink: 0
              }}
            >
              {brand}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div style={{ padding: "16px", flex: 1 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, justifyItems: "center" }}>
          {error ? (
            <div style={{ gridColumn: "span 2", textAlign: "center", padding: "40px 0", color: "#64748b" }}>
              {error}
            </div>
          ) : isLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : categoryItems.length === 0 ? (
            <div style={{ gridColumn: "span 2", textAlign: "center", padding: "40px 0", color: "#64748b" }}>
              No items found in this category.
            </div>
          ) : (
            categoryItems.map(item => (
              <div key={item.id} onClick={() => router.push(`/rentals/${item.id}`)} style={{ cursor: "pointer", width: "100%", display: "flex", justifyContent: "center" }}>
                <ProductCard
                  id={item.id}
                  itemName={item.itemName}
                  pricePerHour={item.pricePerHour}
                  category={item.category}
                  branch={item.branch}
                  distance={item.distance}
                  sellerUsername={item.sellerUsername}
                  rating={item.rating}
                  variant="grid"
                  imageUrl={
                    item.category === "calculator" ? "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&q=80" :
                    item.category === "drafter" ? "https://images.unsplash.com/photo-1503387837-b154d5074bd2?w=400&q=80" :
                    "https://images.unsplash.com/photo-1581591524425-c7e0978865fc?w=400&q=80"
                  }
                />
              </div>
            ))
          )}
          
          {/* Fill empty space if fewer than 4 items */}
          {!isLoading && categoryItems.length < 4 && (
            <div
              style={{
                width: 148,
                height: 236,
                borderRadius: 14,
                border: "2px dashed #cbd5e1",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "#f8fafc",
                padding: 16,
                textAlign: "center"
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 8 }}>✨</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Be the first!</div>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 12 }}>List a {displayTitle} now</div>
              <button onClick={() => router.push(`/list-item?category=${slug}`)} style={{ padding: "6px 12px", background: "#5B4CDB", color: "#fff", fontSize: 11, fontWeight: 700, borderRadius: 6, border: "none", cursor: "pointer" }}>
                + List Item
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
