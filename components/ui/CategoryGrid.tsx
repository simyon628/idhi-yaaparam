import React from "react";
import Link from "next/link";
import { Calculator, CheckSquare, GraduationCap, PenTool, BookOpen, MoreHorizontal } from "lucide-react";

export const CATEGORIES = [
    { id: "calculator", name: "Calculator", icon: Calculator, color: "text-blue-500", bg: "bg-blue-50" },
    { id: "drafter", name: "Drafter", icon: PenTool, color: "text-orange-500", bg: "bg-orange-50" },
    { id: "lab-coat", name: "Lab Coat", icon: GraduationCap, color: "text-cyan-500", bg: "bg-cyan-50" },
    { id: "geometry", name: "Geometry Set", icon: CheckSquare, color: "text-purple-500", bg: "bg-purple-50" },
    { id: "books", name: "Books/Notes", icon: BookOpen, color: "text-emerald-500", bg: "bg-emerald-50" },
    { id: "others", name: "Others", icon: MoreHorizontal, color: "text-slate-500", bg: "bg-slate-50" },
];

export function CategoryGrid() {
    return (
        <div className="py-6 px-1">
            <h3 className="text-slate-800 font-black mb-4 text-lg px-1" style={{ fontFamily: "Outfit, sans-serif" }}>
                Browse Categories
            </h3>
            <div className="grid grid-cols-3 gap-3">
                {CATEGORIES.map((cat) => (
                    <Link
                        key={cat.id}
                        href={`/category/${cat.id}`}
                        className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-100 bg-white hover:border-indigo-100 hover:shadow-sm transition-all group"
                    >
                        <div className={`w-12 h-12 rounded-full ${cat.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                            <cat.icon className={`w-6 h-6 ${cat.color}`} />
                        </div>
                        <span className="text-xs font-bold text-slate-700 text-center leading-tight">
                            {cat.name}
                        </span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
