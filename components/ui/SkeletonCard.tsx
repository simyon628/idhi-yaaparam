import React from "react";

export function SkeletonCard({ variant = 'grid' }: { variant?: 'grid' | 'scroll' }) {
  const imageHeight = variant === 'scroll' ? 105 : 130;
  const width = variant === 'scroll' ? 148 : '100%';
  
  return (
    <div
      style={{
        width,
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid rgba(0,0,0,0.05)",
        backgroundColor: "#fff",
        boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Image shimmer */}
      <div style={{
        width: '100%', height: imageHeight,
        background: "linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.4s infinite ease-in-out",
      }} />
      
      {/* Info shimmer */}
      <div style={{ padding: "8px 10px 10px", flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ height: 12, background: "#f1f5f9", borderRadius: 4, width: "88%", animation: "shimmer 1.4s 0.1s infinite" }} />
        <div style={{ height: 10, background: "#f1f5f9", borderRadius: 4, width: "55%", animation: "shimmer 1.4s 0.15s infinite" }} />
        <div style={{ height: 16, background: "#f1f5f9", borderRadius: 20, width: "35%", animation: "shimmer 1.4s 0.2s infinite" }} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "auto", paddingTop: 4 }}>
          <div style={{ height: 14, background: "#f1f5f9", borderRadius: 4, width: "25%", animation: "shimmer 1.4s 0.25s infinite" }} />
          <div style={{ height: 18, background: "#eef0ff", borderRadius: 20, width: "38%", animation: "shimmer 1.4s 0.3s infinite" }} />
        </div>
      </div>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
