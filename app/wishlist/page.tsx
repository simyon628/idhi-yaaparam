"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Heart, X } from "lucide-react";
import { useWishlistStore } from "@/lib/store";
import { ProductCard } from "@/components/ui/ProductCard";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";

// Using mock data for demo. In a real app, you'd fetch these by IDs.
const MOCK_DB: Record<string, any> = {
  "t1": { id: "t1", itemName: "Scientific Calculator Casio", category: "calculator", branch: "CSE", distance: "0.2 km", sellerUsername: "rahul_svec", pricePerHour: 15, rating: 4.5, imageUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&q=80" },
  "e2": { id: "e2", itemName: "MacBook Air M1", category: "laptop", branch: "CSE", distance: "0.6 km", sellerUsername: "priya_svec", pricePerHour: 100, rating: 4.8, imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80" },
  "a1": { id: "a1", itemName: "Engineering Drafter", category: "drafter", branch: "Mech", distance: "1.2 km", sellerUsername: "vikas_svec", pricePerHour: 25, rating: 4.5, imageUrl: "https://images.unsplash.com/photo-1503387837-b154d5074bd2?w=400&q=80" }
};

export default function WishlistPage() {
  const router = useRouter();
  const { items, toggleItem } = useWishlistStore();

  const wishlistedItems = Array.from(items).map(id => MOCK_DB[id] || { ...MOCK_DB["t1"], id }); // fallback to mock

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#f8fafc", fontFamily: "'DM Sans', sans-serif", paddingBottom: 96 }}>
      <TopBar hideSearch={true} />
      
      <div style={{ padding: "16px 20px", background: "#fff", borderBottom: "1px solid #f1f5f9" }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1e293b", fontFamily: "'Syne', sans-serif" }}>Wishlist ({items.size})</h1>
      </div>

      <div style={{ padding: "16px", flex: 1 }}>
        {items.size === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: 40, textAlign: "center", marginTop: 60 }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <Heart size={40} color="#E24B4A" fill="#E24B4A" />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>Nothing saved yet</h2>
            <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24 }}>Save items you like to view them later.</p>
            <button onClick={() => router.push('/rentals')} style={{ padding: "12px 24px", background: "#0B57D0", color: "#fff", fontWeight: 700, borderRadius: 12, border: "none", cursor: "pointer" }}>Start Browsing</button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, justifyItems: "center" }}>
            {wishlistedItems.map((item) => (
              <div key={item.id} style={{ position: "relative", width: "100%", display: "flex", justifyContent: "center" }}>
                <ProductCard {...item} variant="wishlist" />
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
