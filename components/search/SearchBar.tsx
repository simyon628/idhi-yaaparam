"use client";

import { useRef, useEffect, useState } from "react";
import { Search, X, Mic, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface SearchBarProps {
    query: string;
    onQueryChange: (q: string) => void;
    onSubmit: (q: string) => void;
    onFocus?: () => void;
    onClear: () => void;
    onBack?: () => void;
    placeholder?: string;
    autoFocus?: boolean;
}

export function SearchBar({
    query, onQueryChange, onSubmit, onFocus, onClear, onBack,
    placeholder = "Search items in your college (calculator, lab coat...)",
    autoFocus = false
}: SearchBarProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isListening, setIsListening] = useState(false);

    const handleVoiceSearch = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast.error("Voice search is not supported in this browser.");
            return;
        }
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-IN";

        recognition.onstart = () => { setIsListening(true); toast.info("Listening..."); };
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            onQueryChange(transcript);
            onSubmit(transcript);
            setIsListening(false);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);

        try { recognition.start(); } catch (e) { console.error(e); }
    };

    return (
        <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl px-4 pt-3 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full pl-2 pr-4 h-12 focus-within:border-indigo-500 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(99,102,241,0.1)] transition-all">
                {onBack ? (
                    <button 
                        onClick={onBack}
                        className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors shrink-0"
                        title="Back"
                    >
                        <ChevronLeft className="w-5 h-5 text-slate-800" strokeWidth={2.5} />
                    </button>
                ) : (
                    <div className="w-10 h-10 flex items-center justify-center shrink-0">
                        <Search className="w-4 h-4 text-slate-400" />
                    </div>
                )}
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={e => onQueryChange(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === "Enter" && query.trim()) {
                            onSubmit(query.trim());
                        }
                        if (e.key === "Escape") {
                            onClear();
                            inputRef.current?.blur();
                        }
                    }}
                    onFocus={onFocus}
                    placeholder={placeholder}
                    className="flex-1 bg-transparent text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none"
                    autoFocus={autoFocus}
                    autoComplete="off"
                />
                {query ? (
                    <button
                        onClick={() => { onClear(); inputRef.current?.focus(); }}
                        className="p-1 rounded-full hover:bg-slate-200 transition-colors"
                    >
                        <X className="w-4 h-4 text-slate-400" />
                    </button>
                ) : (
                    <button
                        onClick={handleVoiceSearch}
                        className="p-1 rounded-full hover:bg-slate-200 transition-colors"
                        title="Voice Search"
                    >
                        <Mic className={`w-4 h-4 ${isListening ? "text-rose-500 animate-pulse" : "text-slate-400"}`} />
                    </button>
                )}
            </div>
        </div>
    );
}
