"use client";

import React from "react";
import { createPortal } from "react-dom";
import { useSearchStore } from "@/stores/searchStore";
import SearchDropdownContent from "./SearchDropdownContent";

// Portal mounts to document.body — escapes all parent overflow/z-index stacking
export default function SearchDropdown() {
  const { isOpen } = useSearchStore();

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        // Sits just below the header — TopBar is ~120px (dark bar + search row)
        top: 120,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        pointerEvents: "none", // let clicks through except on the card
      }}
    >
      {/* The actual dropdown card — centered like the rest of your max-w-md app */}
      <div
        style={{
          maxWidth: 448,
          margin: "0 auto",
          pointerEvents: "auto",
          padding: "0 20px", // Align with px-5 in TopBar
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: "0 0 20px 20px",
            boxShadow: "0 16px 48px rgba(0,0,0,0.14), 0 4px 12px rgba(85,72,232,0.08)",
            border: "1px solid rgba(229,231,235,0.8)",
            borderTop: "none",
            overflowY: "auto",
            maxHeight: "60vh", // Prevent covering bottom nav
          }}
          // Stop clicks from bubbling to the transparent outer div
          onMouseDown={(e) => e.stopPropagation()}
        >
          <SearchDropdownContent />
        </div>
      </div>

      {/* Transparent click-blocker below the card closes search on tap */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: -1,
        }}
        onMouseDown={() => useSearchStore.getState().close()}
      />
    </div>,
    document.body
  );
}
