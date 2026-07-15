import React from "react";
import Link from "next/link";

export const CATEGORIES = [
    { id: "calculator",  name: "Calculator", icon: "🖩" },
    { id: "drafter",     name: "Drafter",    icon: "📐" },
    { id: "lab-coat",    name: "Lab Coat",   icon: "🥼" },
    { id: "geometry",    name: "Geometry",   icon: "📏" },
    { id: "electronics", name: "Laptops",    icon: "💻" },
    { id: "books",       name: "Books",      icon: "📚" },
    { id: "others",      name: "More",       icon: "📦" },
];

export function CategoryGrid() {
    return (
        <div 
            className="w-full overflow-x-auto no-scrollbar py-2 flex"
            style={{
                gap: 12,
                scrollbarWidth: "none",
            }}
        >
            {CATEGORIES.map((cat) => (
                <Link
                    key={cat.id}
                    href={`/search?category=${cat.id}`}
                    className="flex items-center justify-center gap-1 bg-white border border-gray-200 py-1.5 rounded-full shadow-sm hover:bg-gray-50 transition-colors shrink-0"
                    style={{
                        width: "calc((min(100vw, 448px) - 80px) / 5.5)",
                    }}
                >
                    <span className="text-sm">{cat.icon}</span>
                    <span className="text-[10px] font-semibold text-gray-800 truncate">{cat.name}</span>
                </Link>
            ))}
        </div>
    );
}
