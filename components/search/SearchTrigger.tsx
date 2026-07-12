"use client";

import React, { useRef, useEffect, useState } from "react";
import { Search, X, Camera, Mic, SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSearchStore } from "@/stores/searchStore";
import { useKeyboardNav } from "@/hooks/useSearch";
import { toast } from "sonner";

export default function SearchTrigger() {
  const router = useRouter();
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
    if (query.trim()) executeSearch(query, router);
  };

  const handleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast("Voice search is not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onstart = () => {
      toast("Listening...");
    };
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      executeSearch(transcript, router);
    };
    recognition.onerror = (event: any) => {
      toast("Error occurred: " + event.error);
    };
    recognition.start();
  };

  const handleCameraSearch = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        toast("Processing image...");
        setTimeout(() => {
          const name = file.name.split('.')[0];
          let simulatedResult = name;
          if (name.toLowerCase().includes("calc")) simulatedResult = "Calculator";
          else if (name.toLowerCase().includes("draft")) simulatedResult = "Drafter";
          else if (name.toLowerCase().includes("coat")) simulatedResult = "Lab Coat";
          
          setQuery(simulatedResult);
          executeSearch(simulatedResult, router);
          toast(`Recognized: ${simulatedResult}`);
        }, 1500);
      }
    };
    input.click();
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: isOpen ? "#FFFFFF" : "#F8FAFC",
        border: isOpen
          ? "1.5px solid rgba(11,87,208,0.5)"
          : "1px solid #E2E8F0",
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
          color: isOpen ? "#0B57D0" : "#64748B",
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
          color: "#0F172A",
          caretColor: "#0B57D0",
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
              onClick={(e) => { e.stopPropagation(); handleCameraSearch(); }}
              style={{
                width: 28,
                height: 28,
                background: "#F1F5F9",
                border: "1px solid #E2E8F0",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <Camera size={14} style={{ color: "#64748B" }} />
            </button>
            {/* Mic */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleVoiceSearch(); }}
              style={{
                width: 28,
                height: 28,
                background: "#F1F5F9",
                border: "1px solid #E2E8F0",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <Mic size={14} style={{ color: "#64748B" }} />
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
              background: "#F1F5F9",
              border: "none",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <X size={12} style={{ color: "#64748B" }} />
          </button>
        )}

        {/* Search submit button */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleSubmit(); }}
          style={{
            height: 28,
            padding: "0 12px",
            background: "linear-gradient(135deg,#0B57D0,#1A73E8)",
            border: "none",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            color: "#fff",
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            letterSpacing: 0.3,
            flexShrink: 0,
            boxShadow: "0 2px 8px rgba(11,87,208,0.35)",
          }}
        >
          Search
        </button>
      </div>
    </div>
  );
}
