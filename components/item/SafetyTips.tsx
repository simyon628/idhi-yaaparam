"use client";

import { useState } from "react";
import { ShieldCheck, ChevronDown, CheckCircle } from "lucide-react";

export function SafetyTips() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm overflow-hidden mb-5">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 active:bg-emerald-100 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <span className="text-[13px] font-bold text-emerald-800">Safety tips</span>
                </div>
                <ChevronDown
                    className={`w-5 h-5 text-emerald-600 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                />
            </button>
            <div
                className="transition-[max-height] duration-300 ease-in-out"
                style={{
                    maxHeight: isOpen ? "300px" : "0",
                    overflow: "hidden"
                }}
            >
                <div className="px-4 pb-4 pt-1 space-y-3">
                    <div className="flex gap-2.5">
                        <CheckCircle className="w-[14px] h-[14px] text-emerald-500 shrink-0 mt-[2px]" />
                        <p className="text-xs font-medium text-emerald-800/80 leading-snug">Meet in a public place on campus (library, canteen, main block)</p>
                    </div>
                    <div className="flex gap-2.5">
                        <CheckCircle className="w-[14px] h-[14px] text-emerald-500 shrink-0 mt-[2px]" />
                        <p className="text-xs font-medium text-emerald-800/80 leading-snug">Inspect the item before borrowing or paying</p>
                    </div>
                    <div className="flex gap-2.5">
                        <CheckCircle className="w-[14px] h-[14px] text-emerald-500 shrink-0 mt-[2px]" />
                        <p className="text-xs font-medium text-emerald-800/80 leading-snug">Never pay in advance before seeing the item</p>
                    </div>
                    <div className="flex gap-2.5">
                        <CheckCircle className="w-[14px] h-[14px] text-emerald-500 shrink-0 mt-[2px]" />
                        <p className="text-xs font-medium text-emerald-800/80 leading-snug">Confirm return date in chat before borrowing</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
