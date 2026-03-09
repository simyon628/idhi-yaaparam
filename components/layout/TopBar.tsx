"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCollege } from "@/contexts/CollegeContext";
import { MapPin, ChevronDown } from "lucide-react";

export function TopBar() {
    const { selectedCollege, setSelectedCollege, isReady } = useCollege();
    const router = useRouter();

    if (!isReady) return null; // Avoid hydration mismatch

    return (
        <>
            <div className="fixed top-0 left-0 right-0 z-40 glass border-b border-white/60 px-5 py-3.5 flex items-center justify-between max-w-md mx-auto shadow-sm transition-all duration-300">
                {/* Left: Logo */}
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg gradient-indigo flex items-center justify-center shadow-indigo shrink-0">
                        <span className="text-base text-white">🚀</span>
                    </div>
                    <span
                        className="text-base font-black text-slate-800 cursor-pointer"
                        style={{ fontFamily: "Outfit, sans-serif" }}
                    >
                        Idhi Yaaparam
                    </span>
                </div>

                {/* Right: Select College */}
                <button
                    onClick={() => {
                        setSelectedCollege(null);
                        router.push("/");
                    }}
                    className="flex items-center gap-1.5 bg-white/60 hover:bg-white border border-indigo-100 px-3 py-1.5 rounded-full transition-colors overflow-hidden shadow-sm backdrop-blur-md"
                >
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
                    <span className="text-[11px] font-bold text-slate-700 truncate max-w-[100px] sm:max-w-[140px]">
                        {selectedCollege ? selectedCollege.name : "Select College"}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                </button>
            </div>
        </>
    );
}
