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
        <div className="py-4 px-2">
            <div className="grid grid-cols-2 gap-3">
                {CATEGORIES.map((cat) => (
                    <Link
                        key={cat.id}
                        href={`/category/${cat.id}`}
                        className="stagger-item flex flex-col p-4 rounded-2xl border border-slate-100 bg-white hover:border-indigo-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
                    >
                        <div className={`w-12 h-12 rounded-xl ${cat.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                            <cat.icon className={`w-6 h-6 ${cat.color}`} />
                        </div>
                        <span className="font-black text-slate-800 text-lg leading-tight mb-1" style={{ fontFamily: "Outfit, sans-serif" }}>
                            {cat.name}
                        </span>
                        <p className="text-[10px] font-bold text-slate-400 leading-tight pr-2">
                            See all {cat.name.toLowerCase()} available to rent in your college.
                        </p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
