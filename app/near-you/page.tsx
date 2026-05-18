"use client";

import React, { useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { ProductCard } from "@/components/ui/ProductCard";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";

const MOCK_DATA = [
  { id: "n1", itemName: "Casio fx-991EX", pricePerHour: 15, category: "calculator", branch: "CSE", distance: 0.2, sellerUsername: "rahul_svec" },
  { id: "n2", itemName: "Mini Drafter", pricePerHour: 20, category: "drafter", branch: "Mech", distance: 0.4, sellerUsername: "anil_svec" },
  { id: "n3", itemName: "Lab Coat", pricePerHour: 15, category: "lab-coat", branch: "Bio", distance: 0.5, sellerUsername: "priya_svec" },
  { id: "n4", itemName: "MacBook Air M1", pricePerHour: 100, category: "laptop", branch: "IT", distance: 0.6, sellerUsername: "sneha_svec" },
  { id: "n5", itemName: "Geometry Box", pricePerHour: 10, category: "geometry", branch: "Civil", distance: 1.0, sellerUsername: "vikas_svec" },
];

export default function NearYouPage() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState("all");

  const filteredItems = activeFilter === "all" ? MOCK_DATA : MOCK_DATA.filter(item => item.category === activeFilter);

  const bands = [
    { label: "Within 0.2 km", max: 0.2 },
    { label: "Within 0.5 km", max: 0.5 },
    { label: "Within 1 km", max: 1.0 },
    { label: "Within 2 km", max: 2.0 },
  ];

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

      <div style={{ position: "sticky", top: 60, zIndex: 10, background: "#fff", borderBottom: "1px solid #f1f5f9" }}>
        <div style={{ padding: "16px 20px 8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <MapPin size={22} color="#00C48C" />
            <div style={{ fontSize: 20, fontWeight: 800, color: "#1e293b", fontFamily: "'Syne', sans-serif" }}>
              Near You
            </div>
          </div>

          {/* Filter Row */}
          <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 8 }}>
            {[
              { id: "all", label: "All" },
              { id: "calculator", label: "Calculator" },
              { id: "drafter", label: "Drafter" },
              { id: "lab-coat", label: "Lab Coat" },
              { id: "laptop", label: "Laptop" }
            ].map(filter => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  border: activeFilter === filter.id ? "none" : "1px solid #e2e8f0",
                  background: activeFilter === filter.id ? "#00C48C" : "#fff",
                  color: activeFilter === filter.id ? "#fff" : "#64748b",
                  cursor: "pointer"
                }}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: "16px 20px" }}>
        {bands.map((band, index) => {
          const prevMax = index === 0 ? 0 : bands[index - 1].max;
          const itemsInBand = filteredItems.filter(item => item.distance > prevMax && item.distance <= band.max);

          if (itemsInBand.length === 0) return null;

          return (
            <div key={band.label} style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 16 }}>📍</span>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: "#1e293b" }}>{band.label}</h3>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, justifyItems: "center" }}>
                {itemsInBand.map(item => (
                  <div key={item.id} onClick={() => router.push(`/rentals/${item.id}`)} style={{ cursor: "pointer", width: "100%" }}>
                    <ProductCard
                      id={item.id}
                      itemName={item.itemName}
                      pricePerHour={item.pricePerHour}
                      category={item.category}
                      branch={item.branch}
                      distance={`${item.distance} km`}
                      sellerUsername={item.sellerUsername}
                      variant="grid"
                      imageUrl={
                        item.category === "calculator" ? "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&q=80" :
                        item.category === "drafter" ? "https://images.unsplash.com/photo-1503387837-b154d5074bd2?w=400&q=80" :
                        item.category === "laptop" ? "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80" :
                        "https://images.unsplash.com/photo-1581591524425-c7e0978865fc?w=400&q=80"
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {filteredItems.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>No items found nearby for this category.</div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
