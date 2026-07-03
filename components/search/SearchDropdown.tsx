import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSearchStore } from "@/stores/searchStore";
import SearchDropdownContent from "./SearchDropdownContent";

// Portal mounts to document.body — escapes all parent overflow/z-index stacking
export default function SearchDropdown() {
  const { isOpen } = useSearchStore();
  const [topOffset, setTopOffset] = useState(120);

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const activeEl = document.activeElement;
      const isSearchInput = activeEl && (activeEl.tagName === "INPUT" || activeEl.getAttribute("type") === "search" || activeEl.getAttribute("inputmode") === "search");
      
      const searchInput = isSearchInput 
        ? activeEl 
        : document.querySelector('input[type="search"]') || 
          document.querySelector('input[type="text"][placeholder*="Search"]') ||
          document.querySelector('input[placeholder*="Search"]');

      if (searchInput) {
        const formEl = searchInput.closest("form") || searchInput;
        const rect = formEl.getBoundingClientRect();
        setTopOffset(rect.bottom);
      } else {
        setTopOffset(120);
      }
    };

    updatePosition();
    const frame = requestAnimationFrame(updatePosition);
    
    window.addEventListener("resize", updatePosition);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen]);

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: topOffset,
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
