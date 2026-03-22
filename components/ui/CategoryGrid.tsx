import React from "react";
import Link from "next/link";
import { Calculator, CheckSquare, GraduationCap, PenTool, BookOpen, MoreHorizontal, ChevronRight, Laptop } from "lucide-react";

export const CATEGORIES = [
    { id: "calculator", name: "Calculator", icon: Calculator, color: "text-blue-600", bg: "bg-blue-50" },
    { id: "drafter", name: "Drafter", icon: PenTool, color: "text-orange-600", bg: "bg-orange-50" },
    { id: "lab-coat", name: "Lab Coat", icon: GraduationCap, color: "text-emerald-600", bg: "bg-emerald-50" },
    { id: "geometry", name: "Geometry Set", icon: CheckSquare, color: "text-purple-600", bg: "bg-purple-50" },
    { id: "electronics", name: "Electronic Gadgets", icon: Laptop, color: "text-rose-600", bg: "bg-rose-50" },
    { id: "books", name: "Books/Notes", icon: BookOpen, color: "text-indigo-600", bg: "bg-indigo-50" },
    { id: "others", name: "Others", icon: MoreHorizontal, color: "text-slate-600", bg: "bg-slate-50" },
];

interface CategoryGridProps {
    counts?: Record<string, number>;
    loading?: boolean;
}

export function CategoryGrid({ counts = {}, loading = false }: CategoryGridProps) {
    return (
        <div className="py-4 px-2">
            <div className="grid grid-cols-2 gap-3 pb-8">
                {CATEGORIES.map((cat) => {
                    const count = counts[cat.id] || 0;
                    
                    return (
                        <Link
                            key={cat.id}
                            href={`/search?category=${cat.id}`}
                            className="flex flex-col p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-200 group active:scale-[0.98]"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className={`w-10 h-10 rounded-xl ${cat.bg} flex items-center justify-center`}>
                                    <cat.icon className={`w-5 h-5 ${cat.color}`} strokeWidth={2.5} />
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                            </div>
                            
                            <div className="mt-auto">
                                <span className="font-black text-slate-800 text-[15px] block mb-0.5 leading-tight" style={{ fontFamily: "Outfit, sans-serif" }}>
                                    {cat.name}
                                </span>
                                {loading ? (
                                    <div className="h-3 w-16 bg-slate-100 animate-pulse rounded-full" />
                                ) : (
                                    <span className={`text-[10px] font-bold ${count > 0 ? "text-emerald-500" : "text-slate-400"}`}>
                                        {count > 0 ? `${count} available` : "Browse items"}
                                    </span>
                                )}
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
