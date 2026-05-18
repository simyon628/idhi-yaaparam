"use client";

import React, { useRef, useEffect, useState } from "react";
import { Search, X, Camera, Mic, SlidersHorizontal } from "lucide-react";
import { useSearchStore } from "@/stores/searchStore";
import { useKeyboardNav } from "@/hooks/useSearch";

export default function SearchTrigger() {
  const {
    query,
    isOpen,
    suggestions,
    open,
    close,
    setQuery,
    executeSearch,
  } = useSearchStore();

  const inputRef = useRef<HTMLInputElement>(null);
  const handleKeyDown = useKeyboardNav(suggestions.length);

  const placeholders = [
    "Search calculators...",
    "Find lab coats nearby",
    "Borrow engineering notes"
  ];
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Focus input whenever the dropdown opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleClear = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  const handleSubmit = () => {
    if (query.trim()) executeSearch(query);
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: isOpen ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.10)",
        border: isOpen
          ? "1.5px solid rgba(121,107,255,0.7)"
          : "1px solid rgba(255,255,255,0.14)",
        borderRadius: isOpen ? "14px 14px 0 0" : 14,
        padding: "11px 14px",
        transition: "border 0.15s, background 0.15s, border-radius 0.15s",
        backdropFilter: "blur(10px)",
        cursor: "text",
        position: "relative",
      }}
      onClick={() => {
        if (!isOpen) open();
        inputRef.current?.focus();
      }}
    >
      {/* Search Icon */}
      <Search
        size={17}
        style={{
          color: isOpen ? "rgba(180,172,255,0.9)" : "rgba(255,255,255,0.4)",
          flexShrink: 0,
          transition: "color 0.15s",
        }}
      />

      {/* Input */}
      <input
        ref={inputRef}
        type="search"
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        value={query}
        placeholder={placeholders[placeholderIndex]}
        onFocus={open}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        style={{
          flex: 1,
          border: "none",
          outline: "none",
          background: "transparent",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14,
          color: "#fff",
          caretColor: "#7B72FF",
          minWidth: 0,
        }}
      />

      {/* Right controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>


        {query.length === 0 && (
          <>
            {/* Camera */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); }}
              style={{
                width: 28,
                height: 28,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <Camera size={14} style={{ color: "rgba(255,255,255,0.5)" }} />
            </button>
            {/* Mic */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); }}
              style={{
                width: 28,
                height: 28,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <Mic size={14} style={{ color: "rgba(255,255,255,0.5)" }} />
            </button>
          </>
        )}

        {query.length > 0 && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleClear(); }}
            style={{
              width: 22,
              height: 22,
              background: "rgba(255,255,255,0.15)",
              border: "none",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <X size={12} style={{ color: "rgba(255,255,255,0.7)" }} />
          </button>
        )}

        {/* Search submit button */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleSubmit(); }}
          style={{
            height: 28,
            padding: "0 12px",
            background: "linear-gradient(135deg,#5548E8,#7B72FF)",
            border: "none",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            color: "#fff",
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            letterSpacing: 0.3,
            flexShrink: 0,
            boxShadow: "0 2px 8px rgba(85,72,232,0.35)",
          }}
        >
          Search
        </button>
      </div>
    </div>
  );
}
