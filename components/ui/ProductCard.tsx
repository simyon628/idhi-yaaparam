"use client";

import React, { useState, useCallback } from "react";
import Image from "next/image";
import { Heart, ShoppingBag, Calculator, Ruler, Shirt, Package } from "lucide-react";
import { useWishlistStore } from "@/lib/store";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useListingMode } from "@/lib/hooks/useListingMode";
import { theme } from "@/lib/theme.config";

interface ProductCardProps {
  id: string;
  itemName: string;
  pricePerHour: number;
  category: string;
  branch?: string;
  imageUrl?: string;
  distance?: string;
  sellerUsername?: string;
  rating?: number;
  variant?: 'scroll' | 'grid';
}

function ProductCardComponent({
  id,
  itemName,
  pricePerHour,
  category,
  branch = "CSE",
  imageUrl,
  distance = "0.5 km",
  sellerUsername = "user",
  rating = 4.5,
  variant = 'grid',
}: ProductCardProps) {
  const isWishlisted = useWishlistStore(useCallback((state) => state.items.has(id), [id]));
  const toggleWishlistStore = useWishlistStore((state) => state.toggleItem);
  
  const router = useRouter();
  const { listingMode } = useListingMode();

  const getButtonBg = () => {
    switch (listingMode) {
      case "sell": return "#FF9500";
      case "buy": return "#00C48C";
      default: return theme.brand.primary;
    }
  };

  const [heartScale, setHeartScale] = useState(1);
  const showCheck = false;

  const toggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHeartScale(1.4);
    setTimeout(() => setHeartScale(0.9), 150);
    setTimeout(() => setHeartScale(1), 300);
    toggleWishlistStore(id);
    if (isWishlisted) toast("Removed from wishlist");
    else toast("Saved to Wishlist", { style: { background: "#10B981", color: "#fff", border: "none" } });
  };

  const handleBorrow = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/rentals/${id}`);
  };

  const hasRealPhoto = !!imageUrl;

  return (
    <div
      style={{
        width: variant === 'scroll' ? 150 : '100%',
        height: 290,
        borderRadius: 14,
        overflow: "hidden",
        border: "1px solid #F0F0F0",
        backgroundColor: "#fff",
        boxShadow: "0 4px 18px rgba(0,0,0,0.05)",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      {/* IMAGE AREA */}
      <div style={{ position: 'relative', height: 110, backgroundColor: "#f1f5f9", flexShrink: 0 }}>
        {/* Available badge - top left */}
        <span style={{
          position: 'absolute', top: 8, left: 8,
          background: '#10B981', color: '#fff',
          fontSize: 10, padding: '2px 7px', borderRadius: 20,
          display: 'flex', alignItems: 'center', gap: 3,
          fontWeight: 600,
          zIndex: 2,
        }}>
          <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#fff" }} />
          Available
        </span>
        
        {/* Heart - top right, on image */}
        <button
          onClick={toggleWishlist}
          style={{
            position: 'absolute', top: 8, right: 8,
            background: 'rgba(255,255,255,0.9)',
            border: 'none',
            borderRadius: '50%',
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 2,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <Heart 
            size={14} 
            fill={isWishlisted ? "#E24B4A" : "transparent"} 
            color={isWishlisted ? "#E24B4A" : "#64748b"} 
            style={{
              transition: "transform 0.15s ease",
              transform: `scale(${heartScale})`,
            }}
          />
        </button>
        
        {/* Product icon or photo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', position: 'relative', width: '100%' }}>
          {hasRealPhoto ? (
            <Image
              src={imageUrl}
              alt={itemName}
              fill
              sizes="(max-width: 768px) 50vw, 33vw"
              style={{ objectFit: 'cover' }}
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YxZjVmOSIvPjwvc3ZnPg=="
            />
          ) : (
            <div style={{ color: "#94a3b8" }}>
              {category === "calculator" ? <Calculator size={36} /> : category === "drafter" ? <Ruler size={36} /> : category === "lab-coat" ? <Shirt size={36} /> : <Package size={36} />}
            </div>
          )}
        </div>
      </div>

      {/* INFO AREA */}
      <div style={{ padding: '12px', flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Title wrapper with fixed height */}
        <div style={{ height: 34, overflow: "hidden", marginBottom: 4 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.2, margin: 0 }}>
            {itemName}
          </p>
        </div>
        
        {/* Branch */}
        <p style={{ fontSize: 11, color: theme.brand.primary, fontWeight: 600, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {branch}
        </p>
        
        {/* Seller & distance */}
        <p style={{ fontSize: 11, color: '#888', fontWeight: 400, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          @{sellerUsername} · {distance}
        </p>
        
        {/* Price & Rating Row - Pushed to the bottom */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, marginTop: "auto" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: theme.brand.primary }}>
            ₹{pricePerHour}
            <span style={{ fontSize: 11, fontWeight: 400, color: '#888' }}>/hr</span>
          </span>
          <span style={{ fontSize: 11, color: '#F59E0B', fontWeight: 600 }}>★ {rating}</span>
        </div>
        
        {/* SINGLE BORROW BUTTON */}
        <button style={{
          width: '100%', height: 36,
          background: getButtonBg(), color: '#fff',
          border: 'none', borderRadius: 10,
          fontSize: 13, fontWeight: 700,
          cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center', gap: 6,
          fontFamily: "'DM Sans', sans-serif",
          flexShrink: 0,
        }}
          onClick={handleBorrow}
        >
          {showCheck ? "✓" : (
            <>
              <ShoppingBag size={13} />
              Borrow
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export const ProductCard = React.memo(ProductCardComponent);
