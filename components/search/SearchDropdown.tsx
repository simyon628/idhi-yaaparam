"use client";

import { useEffect, useRef } from "react";
import { Search, Clock, X, TrendingUp } from "lucide-react";
import { SearchSuggestion } from "@/lib/hooks/useSearch";

interface SearchDropdownProps {
    suggestions: SearchSuggestion[];
    recentSearches: string[];
    trendingSearches?: string[];
    collegeName?: string;
    query: string;
    visible: boolean;
    onSelect: (text: string) => void;
    onRemoveRecent: (text: string) => void;
    onClose: () => void;
}

export function SearchDropdown({
    suggestions, recentSearches, trendingSearches = [],
    collegeName = "Campus", query, visible,
    onSelect, onRemoveRecent, onClose
}: SearchDropdownProps) {
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [highlightIndex, setHighlightIndex] = [0, (_: number) => {}]; // simplified; keyboard nav below

    // Close on click outside
    useEffect(() => {
        if (!visible) return;
        const handleClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [visible, onClose]);

    if (!visible) return null;

    // Build display items
    const allItems: Array<{ text: string; icon: React.ReactNode; badge?: string; section: string; removable?: boolean }> = [];
    let count = 0;

    // Section A — Recent searches (only when query is empty or short)
    if (query.length < 2 && recentSearches.length > 0) {
        for (const r of recentSearches.slice(0, 3)) {
            if (count >= 8) break;
            allItems.push({
                text: r,
                icon: <Clock className="w-4 h-4 text-slate-400" />,
                section: "Recent",
                removable: true
            });
            count++;
        }
    }

    // Section B — Suggestions from listings
    if (query.length >= 2) {
        for (const s of suggestions) {
            if (count >= 8) break;
            allItems.push({
                text: s.text,
                icon: <span className="text-base">{s.icon}</span>,
                badge: s.category,
                section: "Suggestions"
            });
            count++;
        }
    }

    // Section C — Trending (only when few suggestions)
    if (count < 6 && trendingSearches.length > 0) {
        for (const t of trendingSearches.slice(0, Math.min(3, 8 - count))) {
            allItems.push({
                text: t,
                icon: <TrendingUp className="w-4 h-4 text-orange-400" />,
                section: `Trending on ${collegeName}`
            });
            count++;
        }
    }

    if (allItems.length === 0) return null;

    // Helper: highlight matched text
    const highlightMatch = (text: string) => {
        if (!query || query.length < 1) return <span className="font-semibold text-slate-800">{text}</span>;
        const lower = text.toLowerCase();
        const q = query.toLowerCase();
        const idx = lower.indexOf(q);
        if (idx < 0) return <span className="font-semibold text-slate-800">{text}</span>;
        return (
            <>
                <span className="font-medium text-slate-500">{text.slice(0, idx)}</span>
                <span className="font-black text-slate-900">{text.slice(idx, idx + query.length)}</span>
                <span className="font-medium text-slate-500">{text.slice(idx + query.length)}</span>
            </>
        );
    };

    // Group by section for headers
    let lastSection = "";

    return (
        <>
            {/* Mobile overlay behind dropdown */}
            <div className="fixed inset-0 bg-black/20 z-40 md:hidden" onClick={onClose} />

            <div
                ref={dropdownRef}
                className="absolute top-full left-0 right-0 mt-2 z-50 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden max-h-[60vh] overflow-y-auto"
            >
                {allItems.map((item, i) => {
                    const showHeader = item.section !== lastSection;
                    lastSection = item.section;

                    return (
                        <div key={`${item.text}-${i}`}>
                            {showHeader && (
                                <div className="px-4 pt-3 pb-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.section}</p>
                                </div>
                            )}
                            <button
                                onClick={() => onSelect(item.text)}
                                className="w-full px-4 py-3 text-left hover:bg-slate-50 active:bg-slate-100 flex items-center gap-3 group transition-colors"
                            >
                                <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                    {item.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm truncate">{highlightMatch(item.text)}</div>
                                    <div className="flex items-center gap-2">
                                        {item.badge && (
                                            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">{item.badge}</span>
                                        )}
                                        {(item as any).count > 0 && (
                                            <span className="text-[10px] font-bold text-slate-400">({(item as any).count} available)</span>
                                        )}
                                    </div>
                                </div>
                                {item.removable && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onRemoveRecent(item.text); }}
                                        className="p-1 rounded-full hover:bg-slate-200 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-3 h-3 text-slate-400" />
                                    </button>
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>
        </>
    );
}
