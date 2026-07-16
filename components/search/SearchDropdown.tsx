"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useSearchStore } from "@/stores/searchStore";
import SearchDropdownContent from "./SearchDropdownContent";

export default function SearchDropdown() {
  const { isOpen, close } = useSearchStore();
  const [topOffset, setTopOffset] = useState(120);
  const [leftOffset, setLeftOffset] = useState(0);
  const [width, setWidth] = useState(448);

  const updatePosition = useCallback(() => {
    // Find the focused search input or any visible search input
    const candidates = [
      document.activeElement,
      document.querySelector('input[type="text"][placeholder*="Search"]'),
      document.querySelector('input[type="text"][placeholder*="search"]'),
      document.querySelector('input[type="search"]'),
    ];

    let searchEl: Element | null = null;
    for (const el of candidates) {
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) {
        searchEl = el;
        break;
      }
    }

    if (searchEl) {
      const formEl = searchEl.closest("form") || searchEl;
      const rect = formEl.getBoundingClientRect();
      setTopOffset(rect.bottom + 2);
      setLeftOffset(rect.left);
      setWidth(rect.width);
    } else {
      setTopOffset(120);
      setLeftOffset(0);
      setWidth(448);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
    const frame = requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: topOffset,
        left: leftOffset,
        width: width,
        zIndex: 9999,
        animation: "searchDropIn 0.18s cubic-bezier(0.22, 1, 0.36, 1) both",
      }}
    >
      {/* Dropdown card */}
      <div
        style={{
          background: "#fff",
          borderRadius: 20,
          boxShadow: "0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(11,87,208,0.08)",
          border: "1px solid rgba(229,231,235,0.8)",
          overflowY: "auto",
          maxHeight: "65vh",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <SearchDropdownContent />
      </div>

      {/* Backdrop — close on tap outside */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: -1,
        }}
        onMouseDown={() => close()}
      />

      <style>{`
        @keyframes searchDropIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
      `}</style>
    </div>,
    document.body
  );
}
