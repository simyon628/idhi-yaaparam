"use client";

import { useRef, useEffect } from "react";

interface FilterChipsProps {
    activeFilters: string[];
    onToggle: (filter: string) => void;
}

const FILTERS = [
    { id: "all", label: "All" },
    { id: "rent", label: "Rent" },
    { id: "buy", label: "Buy" },
    { id: "sell", label: "Sell" },
    { id: "available", label: "Available Now" },
    { id: "under50", label: "Under ₹50/day" },
    { id: "books", label: "Books" },
    { id: "electronics", label: "Electronics" },
    { id: "lab", label: "Lab" },
    { id: "stationery", label: "Stationery" },
];

export function FilterChips({ activeFilters, onToggle }: FilterChipsProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    return (
        <div className="px-4 py-2 bg-white border-b border-slate-100">
            <div
                ref={scrollRef}
                className="flex gap-2 overflow-x-auto no-scrollbar pb-1"
            >
                {FILTERS.map(f => {
                    const isActive = f.id === "all"
                        ? activeFilters.length === 0
                        : activeFilters.includes(f.id);

                    return (
                        <button
                            key={f.id}
                            onClick={() => onToggle(f.id)}
                            className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all active:scale-95 ${
                                isActive
                                    ? "bg-indigo-600 text-white shadow-sm"
                                    : "bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                            }`}
                        >
                            {f.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
