"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Minus, Plus } from "lucide-react";
import { useCartStore } from "@/lib/store";

// Mock Data for Cart Items
const MOCK_DB: Record<string, any> = {
  "t1": { id: "t1", itemName: "Scientific Calculator Casio", category: "calculator", branch: "CSE", distance: "0.2 km", sellerUsername: "rahul_svec", pricePerHour: 15, rating: 4.5, imageUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&q=80" },
  "e2": { id: "e2", itemName: "MacBook Air M1", category: "laptop", branch: "CSE", distance: "0.6 km", sellerUsername: "priya_svec", pricePerHour: 100, rating: 4.8, imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80" },
  "a1": { id: "a1", itemName: "Engineering Drafter", category: "drafter", branch: "Mech", distance: "1.2 km", sellerUsername: "vikas_svec", pricePerHour: 25, rating: 4.5, imageUrl: "https://images.unsplash.com/photo-1503387837-b154d5074bd2?w=400&q=80" }
};

export default function CartPage() {
  const router = useRouter();
  const { items: cartItems, updateQty, updateDuration } = useCartStore();
  const [selectedDuration, setSelectedDuration] = useState<number>(1);

  const cartItemIds = Object.keys(cartItems);
  const cartData = cartItemIds.map(id => ({
    ...MOCK_DB[id] || MOCK_DB["t1"], // Fallback if mock is missing
    qty: cartItems[id].qty
  }));

  const itemCharges = cartData.reduce((total, item) => total + (item.pricePerHour * item.qty * selectedDuration), 0);
  const platformFee = itemCharges > 0 ? 2 : 0;
  const gst = itemCharges > 0 ? Math.round(itemCharges * 0.18) : 0;
  const total = itemCharges + platformFee + gst;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "var(--iy-surface)", paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", background: "#0B57D0", color: "#fff", position: "sticky", top: 0, zIndex: 10 }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", display: "flex" }}>
          <ArrowLeft size={24} />
        </button>
        <div style={{ fontSize: 16, fontWeight: 800 }}>My Cart ({cartData.reduce((acc, item) => acc + item.qty, 0)} items)</div>
      </div>

      {cartData.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🛒</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>Your cart is empty</h2>
          <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24 }}>Looks like you haven't added anything to your cart yet.</p>
          <button onClick={() => router.push('/rentals')} style={{ padding: "12px 24px", background: "#0B57D0", color: "#fff", fontWeight: 700, borderRadius: 12, border: "none", cursor: "pointer" }}>Start Browsing</button>
        </div>
      ) : (
        <>
          <div style={{ padding: "16px", background: "#fff", marginBottom: 8 }}>
            {cartData.map((item, index) => (
              <div key={item.id} style={{ display: "flex", gap: 16, padding: "16px 0", borderBottom: index < cartData.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                <div style={{ width: 64, height: 64, borderRadius: 8, background: "#f1f5f9", overflow: "hidden", flexShrink: 0 }}>
                  {item.imageUrl ? <img src={item.imageUrl} alt={item.itemName} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{item.category === "calculator" ? "🖩" : "📦"}</div>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", marginBottom: 2 }}>{item.itemName}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#0B57D0" }}>{item.branch}</span>
                    <span style={{ fontSize: 10, color: "#888780" }}>@{item.sellerUsername}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10, color: "#888780", marginBottom: 8 }}>
                    <span>📍 {item.distance}</span>
                    <span>★ {item.rating}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>₹{item.pricePerHour}<span style={{ fontSize: 10, color: "#888780", fontWeight: 400 }}>/hr</span></div>
                    <div style={{ display: "flex", alignItems: "center", background: "#EEF0FF", borderRadius: 8, padding: "4px 8px", color: "#0B57D0", fontWeight: 700, gap: 12 }}>
                      <button onClick={() => updateQty(item.id, -1)} style={{ background: "none", border: "none", color: "#0B57D0", cursor: "pointer", display: "flex" }}><Minus size={14} /></button>
                      <span style={{ fontSize: 13 }}>{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} style={{ background: "none", border: "none", color: "#0B57D0", cursor: "pointer", display: "flex" }}><Plus size={14} /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding: "16px", background: "var(--iy-ink)", marginBottom: 8 }}>
            <h3 style={{ fontSize: 12, fontWeight: 800, color: "var(--iy-text2)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>Rental Duration</h3>
            <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 4 }}>
              {[1, 2, 4, 8].map(hrs => (
                <button
                  key={hrs}
                  onClick={() => setSelectedDuration(hrs)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: 600,
                    border: selectedDuration === hrs ? "1px solid #0B57D0" : "1px solid #e2e8f0",
                    background: selectedDuration === hrs ? "#0B57D0" : "var(--iy-surface)",
                    color: selectedDuration === hrs ? "#fff" : "var(--iy-text1)",
                    cursor: "pointer",
                    flexShrink: 0
                  }}
                >
                  {hrs} {hrs === 1 ? 'hr' : 'hrs'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: "16px", background: "var(--iy-ink)", marginBottom: 8 }}>
            <h3 style={{ fontSize: 12, fontWeight: 800, color: "var(--iy-text2)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>Bill Summary</h3>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--iy-text1)", marginBottom: 8 }}>
              <span>Item charges</span>
              <span>₹{itemCharges}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--iy-text1)", marginBottom: 8 }}>
              <span>Platform fee</span>
              <span>₹{platformFee}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--iy-text1)", marginBottom: 12 }}>
              <span>GST (18%)</span>
              <span>₹{gst}</span>
            </div>
            <div style={{ height: 1, background: "#e2e8f0", margin: "12px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 800, color: "#0B57D0" }}>
              <span>Total</span>
              <span>₹{total}</span>
            </div>
          </div>

          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "16px", background: "var(--iy-ink)", borderTop: "1px solid #e2e8f0", zIndex: 50, maxWidth: 448, margin: "0 auto" }}>
            <button style={{ width: "100%", height: 52, borderRadius: 14, background: "#0B57D0", color: "#fff", fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", border: "none", cursor: "pointer", boxShadow: "0 4px 12px rgba(91,76,219,0.3)" }}>
              <span>₹{total}</span>
              <span>Proceed to Checkout →</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
