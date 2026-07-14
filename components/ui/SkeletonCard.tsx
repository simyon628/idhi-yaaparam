import React from "react";

export function SkeletonCard({ variant = 'grid' }: { variant?: 'grid' | 'scroll' }) {
  return (
    <div
      style={{
        width: variant === 'scroll' ? 'clamp(120px, 33.1vw, 151px)' : '100%',
        borderRadius: 'var(--iy-card-radius, 14px)',
        overflow: "hidden",
        border: "1px solid #F0F0F0",
        backgroundColor: "#fff",
        boxShadow: 'var(--iy-card-shadow, 0 2px 12px rgba(0,0,0,0.06))',
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      {/* Image shimmer — matches aspect-ratio: 4/3 */}
      <div style={{
        width: '100%',
        aspectRatio: '4 / 3',
        background: "linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.4s infinite ease-in-out",
        flexShrink: 0,
      }} />
      
      {/* Info shimmer — matches ProductCard layout */}
      <div style={{ padding: 8, flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        {/* Title - 2 lines */}
        <div style={{ height: 14, background: "#f1f5f9", borderRadius: 4, width: "90%", animation: "shimmer 1.4s 0.1s infinite", backgroundSize: "200% 100%" }} />
        <div style={{ height: 14, background: "#f1f5f9", borderRadius: 4, width: "60%", animation: "shimmer 1.4s 0.12s infinite", backgroundSize: "200% 100%" }} />
        {/* Branch */}
        <div style={{ height: 10, background: "#f1f5f9", borderRadius: 4, width: "35%", animation: "shimmer 1.4s 0.15s infinite", backgroundSize: "200% 100%", marginTop: 2 }} />
        {/* Seller */}
        <div style={{ height: 10, background: "#f1f5f9", borderRadius: 4, width: "55%", animation: "shimmer 1.4s 0.18s infinite", backgroundSize: "200% 100%" }} />
        {/* Price row — pushed to bottom */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: 6 }}>
          <div style={{ height: 14, background: "#f1f5f9", borderRadius: 4, width: "30%", animation: "shimmer 1.4s 0.2s infinite", backgroundSize: "200% 100%" }} />
          <div style={{ height: 12, background: "#f1f5f9", borderRadius: 4, width: "18%", animation: "shimmer 1.4s 0.22s infinite", backgroundSize: "200% 100%" }} />
        </div>
        {/* Button */}
        <div style={{ height: 30, background: "#f1f5f9", borderRadius: 10, width: "100%", animation: "shimmer 1.4s 0.25s infinite", backgroundSize: "200% 100%", marginTop: 8 }} />
      </div>
    </div>
  );
}
