"use client";

import { MapPin, Clock, User } from "lucide-react";

interface ContextBarProps {
    block: string;
    labTime: string;
    userRoll?: string;
}

export function ContextBar({ block, labTime, userRoll }: ContextBarProps) {
    return (
        <div className="fixed top-0 left-0 right-0 z-50 glass border-b border-slate-700/50 px-5 py-3.5 flex items-center justify-between max-w-md mx-auto">
            {/* Left: Location */}
            <div className="flex items-center gap-2.5">
                <div className="bg-blue-500/15 border border-blue-500/25 p-2 rounded-xl">
                    <MapPin className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Location</p>
                    <p className="text-sm font-bold text-white">{block}</p>
                </div>
            </div>

            {/* Right: Lab countdown + roll */}
            <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1.5 text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-xs font-black">{labTime}</span>
                </div>
                {userRoll && (
                    <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-600">
                        <User className="w-3 h-3" />
                        <span>{userRoll}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
