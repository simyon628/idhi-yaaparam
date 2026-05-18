import React from "react";

export function SkeletonCard() {
  return (
    <div
      style={{
        width: 148,
        height: 236,
        background: "#fff",
        borderRadius: 14,
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ width: 148, height: 120, background: "#f1f5f9", animation: "pulse 1.5s infinite ease-in-out" }} />
      <div style={{ padding: "8px", flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ height: 14, background: "#f1f5f9", borderRadius: 4, width: "90%", animation: "pulse 1.5s infinite ease-in-out" }} />
        <div style={{ height: 14, background: "#f1f5f9", borderRadius: 4, width: "60%", animation: "pulse 1.5s infinite ease-in-out" }} />
        <div style={{ height: 12, background: "#f1f5f9", borderRadius: 4, width: "40%", animation: "pulse 1.5s infinite ease-in-out", marginTop: 4 }} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "auto" }}>
          <div style={{ height: 16, background: "#f1f5f9", borderRadius: 4, width: "30%", animation: "pulse 1.5s infinite ease-in-out" }} />
          <div style={{ height: 16, background: "#f1f5f9", borderRadius: 4, width: "20%", animation: "pulse 1.5s infinite ease-in-out" }} />
        </div>
        <div style={{ height: 28, background: "#f1f5f9", borderRadius: 6, width: "100%", animation: "pulse 1.5s infinite ease-in-out", marginTop: 4 }} />
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
      `}</style>
    </div>
  );
}
