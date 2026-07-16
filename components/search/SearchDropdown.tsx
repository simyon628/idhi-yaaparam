"use client";

import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useSearchStore } from "@/stores/searchStore";
import { ArrowLeft, Search as SearchIcon, X, Camera, Mic } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import SearchDropdownContent from "./SearchDropdownContent";
import { useKeyboardNav } from "@/hooks/useSearch";

export default function SearchDropdown() {
  const router = useRouter();
  const { isOpen, query, setQuery, executeSearch, close, suggestions } = useSearchStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const handleKeyDown = useKeyboardNav(suggestions.length);

  // Auto-focus input when search overlay opens
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!isOpen || typeof document === "undefined") return null;

  const handleClear = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (query.trim()) {
      executeSearch(query, router);
    }
  };

  const handleVoiceSearch = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Voice search is not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.onstart = () => {
      toast.info("Listening...");
    };
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      executeSearch(transcript, router);
    };
    recognition.onerror = (event: any) => {
      toast.error("Voice recognition error: " + event.error);
    };
    recognition.start();
  };

  const handleCameraSearch = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.capture = "environment";
    fileInput.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        toast.info("Analyzing image...");
        setTimeout(() => {
          const name = file.name.toLowerCase();
          let simulatedResult = "Calculator";
          if (name.includes("draft")) simulatedResult = "Drafter";
          else if (name.includes("coat")) simulatedResult = "Lab Coat";
          else if (name.includes("book") || name.includes("gate")) simulatedResult = "GATE Books";
          else if (name.includes("laptop")) simulatedResult = "MacBook Laptop";

          setQuery(simulatedResult);
          executeSearch(simulatedResult, router);
          toast.success(`Recognized: ${simulatedResult}`);
        }, 1500);
      }
    };
    fileInput.click();
  };

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "rgba(15, 23, 42, 0.3)", // blur overlay on desktop viewports
        backdropFilter: "blur(2px)",
        display: "flex",
        justifyContent: "center",
      }}
      onClick={() => close()}
    >
      <div
        onClick={(e) => e.stopPropagation()} // prevent clicking overlay from closing when clicking inside
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 448, // matching app mobile layout constraint
          background: "#ffffff",
          display: "flex",
          flexDirection: "column",
          fontFamily: "'DM Sans', sans-serif",
          boxShadow: "0 0 40px rgba(0,0,0,0.15)",
          animation: "searchSlideUpMobile 0.22s cubic-bezier(0.22, 1, 0.36, 1) both",
        }}
      >
        {/* ── Flipkart-Style Header ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 16px",
            borderBottom: "1px solid #f1f5f9",
            background: "#ffffff",
          }}
        >
          {/* Back Button */}
          <button
            onClick={() => close()}
            style={{
              background: "#f1f5f9",
              border: "none",
              borderRadius: 12,
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <ArrowLeft size={20} color="#334155" />
          </button>

          {/* Input Form */}
          <form
            onSubmit={handleSubmit}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              background: "#f1f5f9",
              borderRadius: 14,
              height: 44,
              padding: "0 10px",
            }}
          >
            <SearchIcon size={18} color="#64748b" style={{ marginRight: 8, flexShrink: 0 }} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search on Idhi Yaaparam..."
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                fontSize: 14,
                fontWeight: 600,
                color: "#1e293b",
                width: "100%",
              }}
            />

            {/* Clear button when typing */}
            {query.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 4,
                  display: "flex",
                  alignItems: "center",
                  marginRight: 4,
                }}
              >
                <X size={16} color="#64748b" />
              </button>
            )}

            {/* Camera Search */}
            <button
              type="button"
              onClick={handleCameraSearch}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 6,
                display: "flex",
                alignItems: "center",
              }}
            >
              <Camera size={18} color="#64748b" />
            </button>

            {/* Voice Search */}
            <button
              type="button"
              onClick={handleVoiceSearch}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 6,
                display: "flex",
                alignItems: "center",
              }}
            >
              <Mic size={18} color="#64748b" />
            </button>
          </form>
        </div>

        {/* ── Scrollable Results / Suggestions Body ── */}
        <div style={{ flex: 1, overflowY: "auto", background: "#ffffff" }}>
          <SearchDropdownContent />
        </div>
      </div>

      {/* Slide up animation CSS */}
      <style>{`
        @keyframes searchSlideUpMobile {
          from {
            transform: translate(-50%, 100%);
          }
          to {
            transform: translate(-50%, 0);
          }
        }
      `}</style>
    </div>,
    document.body
  );
}
