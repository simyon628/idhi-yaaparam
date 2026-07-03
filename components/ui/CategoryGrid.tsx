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
        <div className="w-full overflow-x-auto no-scrollbar py-2 flex gap-2 px-4 snap-x">
            {CATEGORIES.map((cat) => (
                <Link
                    key={cat.id}
                    href={`/search?category=${cat.id}`}
                    className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-full shadow-sm hover:bg-gray-50 transition-colors shrink-0 snap-start"
                >
                    <span className="text-sm">{cat.icon}</span>
                    <span className="text-xs font-semibold text-gray-800">{cat.name}</span>
                </Link>
            ))}
        </div>
    );
}
