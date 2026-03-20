"use client";
import { useState } from "react";
import { Shield, ChevronDown, CheckCircle2 } from "lucide-react";

const TIPS = [
    "Meet in a public place on campus (library, canteen, main block)",
    "Inspect the item before paying or borrowing",
    "Never pay in advance for an item you haven't seen",
    "For rentals, confirm return date in writing via chat",
];

export function SafetyTips() {
    const [open, setOpen] = useState(false);

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <button
                className="w-full flex items-center justify-between p-4"
                onClick={() => setOpen(o => !o)}
            >
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                        <Shield className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="font-bold text-slate-700 text-sm">Safety tips</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
            </button>
            <div
                className="overflow-hidden transition-all duration-300"
                style={{ maxHeight: open ? "300px" : "0px" }}
            >
                <div className="px-4 pb-4 flex flex-col gap-3 border-t border-slate-50 pt-3">
                    {TIPS.map((tip, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                            <p className="text-sm text-slate-600 leading-relaxed">{tip}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
