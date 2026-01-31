"use client";

import { MapPin, Clock } from "lucide-react";

interface ContextBarProps {
    block: string;
    labTime: string;
}

export function ContextBar({ block, labTime }: ContextBarProps) {
    return (
        <div className="fixed top-0 left-0 right-0 z-50 glass border-b border-zinc-100 px-6 py-4 flex items-center justify-between max-w-md mx-auto">
            <div className="flex items-center gap-2">
                <div className="bg-primary/10 p-2 rounded-xl">
                    <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Current Location</p>
                    <p className="text-sm font-bold text-zinc-900">{block}</p>
                </div>
            </div>
            <div className="flex flex-col items-end">
                <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold">{labTime}</span>
                </div>
                <p className="text-[10px] font-medium text-zinc-400 mt-1 italic">until next lab</p>
            </div>
        </div>
    );
}
