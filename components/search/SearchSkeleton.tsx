"use client";

import React from "react";

interface SearchSkeletonProps {
  count?: number;
}

export default function SearchSkeleton({ count = 4 }: SearchSkeletonProps) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            padding: "11px 16px",
            gap: 12,
          }}
        >
          {/* Left icon placeholder */}
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: "#e2e8f0",
              animation: "pulse 1.5s ease-in-out infinite",
              flexShrink: 0,
            }}
          />
          {/* Text placeholder */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <div
              style={{
                height: 14,
                background: "#e2e8f0",
                borderRadius: 6,
                width: `${60 + (i % 3) * 15}%`,
                animation: "pulse 1.5s ease-in-out infinite",
                animationDelay: `${i * 0.1}s`,
              }}
            />
          </div>
          {/* Right tag placeholder */}
          <div
            style={{
              height: 20,
              width: 60,
              background: "#e2e8f0",
              borderRadius: 20,
              animation: "pulse 1.5s ease-in-out infinite",
              animationDelay: `${i * 0.15}s`,
            }}
          />
        </div>
      ))}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
