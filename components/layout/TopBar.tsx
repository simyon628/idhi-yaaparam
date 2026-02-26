"use client";

import { useState } from "react";
import { useCollege } from "@/contexts/CollegeContext";
import { Search, MapPin, X, ChevronDown } from "lucide-react";
import { COLLEGES } from "@/lib/constants";

export function TopBar() {
    const { selectedCollege, setSelectedCollege, isReady } = useCollege();
    const [isSelecting, setIsSelecting] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const filteredColleges = COLLEGES.filter(c =>
        c.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!isReady) return null; // Avoid hydration mismatch

    return (
        <>
            <div className="fixed top-0 left-0 right-0 z-40 glass border-b border-slate-700/50 px-5 py-3.5 flex items-center justify-between max-w-md mx-auto">
                {/* Left: Logo */}
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg gradient-indigo flex items-center justify-center shadow-indigo shadow-sm shrink-0">
                        <span className="text-base text-white">📦</span>
                    </div>
                    <span className="text-sm font-black text-white" style={{ fontFamily: "Outfit, sans-serif" }}>
                        Idhi Yaaparam
                    </span>
                </div>

                {/* Right: Select College */}
                <button
                    onClick={() => setIsSelecting(true)}
                    className="flex items-center gap-1.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-full transition-colors overflow-hidden"
                >
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
                    <span className="text-[11px] font-bold text-slate-300 truncate max-w-[100px] sm:max-w-[140px]">
                        {selectedCollege || "Select College"}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                </button>
            </div>

            {/* Selection Modal / Bottom Sheet */}
            {isSelecting && (
                <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm max-w-md mx-auto">
                    <div className="bg-[hsl(222,47%,11%)] border-t border-slate-700 rounded-t-3xl w-full h-[85vh] flex flex-col animate-in slide-in-from-bottom-full duration-300">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
                            <div>
                                <h2 className="text-xl font-black text-white" style={{ fontFamily: "Outfit, sans-serif" }}>
                                    Select your campus
                                </h2>
                                <p className="text-xs font-semibold text-slate-500 mt-0.5">Find your college to see items near you.</p>
                            </div>
                            <button
                                onClick={() => setIsSelecting(false)}
                                className="p-2 bg-slate-800/50 rounded-full text-slate-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Search Input */}
                        <div className="p-5">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Search your college (e.g., SRK...)"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-14 pl-12 pr-4 bg-slate-800/50 border border-slate-700 rounded-2xl text-white placeholder-slate-500 font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 outline-none transition-all"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto px-5 pb-10">
                            {filteredColleges.length === 0 ? (
                                <p className="text-center text-slate-500 mt-10 text-sm font-medium">No colleges found matching "{searchQuery}"</p>
                            ) : (
                                <div className="space-y-2">
                                    {filteredColleges.map((college) => (
                                        <button
                                            key={college}
                                            onClick={() => {
                                                setSelectedCollege(college);
                                                setIsSelecting(false);
                                            }}
                                            className={`w-full text-left p-4 rounded-xl border transition-all ${selectedCollege === college
                                                    ? "bg-indigo-500/10 border-indigo-500/30"
                                                    : "bg-slate-800/30 border-transparent hover:border-slate-700"
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                                                    <span className="text-lg">🎓</span>
                                                </div>
                                                <div>
                                                    <p className={`font-bold ${selectedCollege === college ? "text-indigo-400" : "text-slate-200"}`}>
                                                        {college}
                                                    </p>
                                                    <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-widest mt-0.5">
                                                        Partner Campus
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
