"use client";

import { Search } from "lucide-react";

interface SearchEmptyStateProps {
    query: string;
    suggestions?: string[];
    onSuggestionClick: (text: string) => void;
    onRequestClick: () => void;
}

export function SearchEmptyState({ query, suggestions = [], onSuggestionClick, onRequestClick }: SearchEmptyStateProps) {
    const defaultSuggestions = suggestions.length > 0 ? suggestions : ["Calculator", "Lab Coat", "Drafter"];

    return (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            {/* SVG Illustration */}
            <div className="w-24 h-24 mb-6 relative">
                <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <circle cx="48" cy="48" r="44" fill="#F1F5F9" stroke="#E2E8F0" strokeWidth="2"/>
                    <circle cx="42" cy="40" r="16" stroke="#94A3B8" strokeWidth="3" fill="none"/>
                    <line x1="53.5" y1="51.5" x2="66" y2="64" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round"/>
                    <path d="M36 38 C38 34 46 34 48 38" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" fill="none"/>
                </svg>
            </div>

            <h3 className="text-lg font-black text-slate-800 mb-1">
                No items found for &ldquo;{query}&rdquo;
            </h3>
            <p className="text-sm text-slate-500 font-medium mb-6">
                on your campus
            </p>

            {/* Suggested searches */}
            <div className="mb-6 space-y-2 w-full max-w-xs">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Try searching for</p>
                <div className="flex flex-wrap justify-center gap-2">
                    {defaultSuggestions.map(s => (
                        <button
                            key={s}
                            onClick={() => onSuggestionClick(s)}
                            className="px-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 hover:border-indigo-400 hover:text-indigo-600 active:scale-95 transition-all"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Request button */}
            <button
                onClick={onRequestClick}
                className="bg-indigo-600 text-white px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest shadow-lg hover:bg-indigo-700 active:scale-95 transition-all"
            >
                Post a Request Instead →
            </button>
        </div>
    );
}
