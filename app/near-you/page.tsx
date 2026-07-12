"use client";

import React, { useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { ProductCard } from "@/components/ui/ProductCard";
import { useRouter } from "next/navigation";
import { MapPin, SlidersHorizontal } from "lucide-react";
import SearchTrigger from "@/components/search/SearchTrigger";

const MOCK_DATA = [
  { id: "n1", itemName: "Casio fx-991EX", pricePerHour: 15, category: "calculator", branch: "CSE", distance: 0.2, sellerUsername: "rahul_svec" },
  { id: "n2", itemName: "Mini Drafter", pricePerHour: 20, category: "drafter", branch: "Mech", distance: 0.4, sellerUsername: "anil_svec" },
  { id: "n3", itemName: "Lab Coat", pricePerHour: 15, category: "lab-coat", branch: "Bio", distance: 0.5, sellerUsername: "priya_svec" },
  { id: "n4", itemName: "MacBook Air M1", pricePerHour: 100, category: "laptop", branch: "IT", distance: 0.6, sellerUsername: "sneha_svec" },
  { id: "n5", itemName: "Geometry Box", pricePerHour: 10, category: "geometry", branch: "Civil", distance: 1.0, sellerUsername: "vikas_svec" },
];

export default function NearYouPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeDepartment, setActiveDepartment] = useState("all");

  const filteredItems = MOCK_DATA.filter(item => {
    const catMatch = activeCategory === "all" || item.category === activeCategory;
    const deptMatch = activeDepartment === "all" || item.branch.toLowerCase() === activeDepartment.toLowerCase();
    return catMatch && deptMatch;
  });

  const bands = [
    { label: "Within 0.5 km", max: 0.5 },
    { label: "Within 1 km", max: 1.0 },
    { label: "Within 5 km", max: 5.0 },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        paddingBottom: 96,
        background: "#F8FAFC",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <TopBar />

      <div style={{ position: "sticky", top: 60, zIndex: 10, background: "#fff", borderBottom: "1px solid #E2E8F0", paddingBottom: 12 }}>
        <div style={{ padding: "16px 16px 8px" }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <MapPin size={22} color="#0B57D0" />
            <div style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", fontFamily: "'Outfit', sans-serif" }}>
              Near You
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <SearchTrigger />
          </div>

          {/* Filters Area */}
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, background: "#F1F5F9", borderRadius: 10, flexShrink: 0 }}>
              <SlidersHorizontal size={16} color="#64748B" />
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 10, overflow: "hidden", flex: 1 }}>
              {/* Category Filter */}
              <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 4 }}>
                {[
                  { id: "all", label: "All Items" },
                  { id: "calculator", label: "Calculators" },
                  { id: "drafter", label: "Drafters" },
                  { id: "lab-coat", label: "Lab Coats" },
                  { id: "laptop", label: "Laptops" }
                ].map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => setActiveCategory(filter.id)}
                    style={{
                      padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", cursor: "pointer", transition: "all 0.2s",
                      border: activeCategory === filter.id ? "1px solid #0B57D0" : "1px solid #E2E8F0",
                      background: activeCategory === filter.id ? "#0B57D0" : "#fff",
                      color: activeCategory === filter.id ? "#fff" : "#475569"
                    }}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {/* Department Filter */}
              <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 4 }}>
                {[
                  { id: "all", label: "All Depts" },
                  { id: "cse", label: "CSE" },
                  { id: "mech", label: "Mech" },
                  { id: "bio", label: "Bio" },
                  { id: "it", label: "IT" },
                  { id: "civil", label: "Civil" }
                ].map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => setActiveDepartment(filter.id)}
                    style={{
                      padding: "4px 12px", borderRadius: 16, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", cursor: "pointer", transition: "all 0.2s",
                      border: activeDepartment === filter.id ? "1px solid #1A73E8" : "1px solid #E2E8F0",
                      background: activeDepartment === filter.id ? "#EEF2FF" : "#F8FAFC",
                      color: activeDepartment === filter.id ? "#0B57D0" : "#64748B"
                    }}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      <div style={{ padding: "20px 16px" }}>
        {bands.map((band, index) => {
          const prevMax = index === 0 ? 0 : bands[index - 1].max;
          const itemsInBand = filteredItems.filter(item => item.distance > prevMax && item.distance <= band.max);

          if (itemsInBand.length === 0) return null;

          return (
            <div key={band.label} style={{ marginBottom: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#0B57D0" }} />
                <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", margin: 0, letterSpacing: 0.2 }}>{band.label}</h3>
                <div style={{ flex: 1, height: 1, background: "#E2E8F0", marginLeft: 8 }} />
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
                {itemsInBand.map(item => (
                  <div key={item.id} onClick={() => router.push(`/rentals/${item.id}`)} style={{ cursor: "pointer" }}>
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
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", textAlign: "center", background: "#fff", borderRadius: 20, border: "1px dashed #CBD5E1", marginTop: 20 }}>
            <MapPin size={32} color="#94A3B8" style={{ marginBottom: 12, opacity: 0.5 }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#334155", marginBottom: 6 }}>No items found nearby</h3>
            <p style={{ fontSize: 13, color: "#64748B", margin: 0, maxWidth: 200 }}>Try adjusting your filters or search for something else.</p>
            <button onClick={() => { setActiveCategory("all"); setActiveDepartment("all"); }} style={{ marginTop: 16, background: "#EEF2FF", color: "#0B57D0", border: "none", padding: "8px 16px", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Clear Filters</button>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
