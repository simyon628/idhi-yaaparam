"use client";

import { Button } from "@/components/ui/button";
import { Zap, MapPin } from "lucide-react";

interface UrgencyItem {
    id: string;
    name: string;
    location: string;
    distance: string;
    icon: React.ReactNode;
}

const URGENCY_ITEMS: UrgencyItem[] = [
    { id: "1", name: "Calculator", location: "A-204", distance: "120m", icon: "🧮" },
    { id: "2", name: "Drafter", location: "B-112", distance: "200m", icon: "📐" },
    { id: "3", name: "Geometry", location: "A-305", distance: "90m", icon: "📏" },
];

export function UrgencySection() {
    return (
        <div className="gradient-green rounded-[2rem] p-6 shadow-xl shadow-primary/20 text-white">
            <div className="flex items-center gap-2 mb-6">
                <Zap className="w-5 h-5 fill-white" />
                <h2 className="text-xl font-bold tracking-tight">Need it NOW?</h2>
            </div>

            <div className="space-y-4">
                {URGENCY_ITEMS.map((item) => (
                    <div key={item.id} className="flex items-center justify-between bg-white/10 backdrop-blur-sm p-3 rounded-2xl border border-white/10">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{item.icon}</span>
                            <div>
                                <p className="font-bold text-sm">{item.name}</p>
                                <div className="flex items-center gap-1 text-[10px] opacity-80">
                                    <MapPin className="w-3 h-3" />
                                    <span>{item.location} ({item.distance})</span>
                                </div>
                            </div>
                        </div>
                        <Button size="sm" className="bg-white text-primary hover:bg-zinc-100 font-bold text-xs px-4 rounded-xl shadow-lg shadow-black/10">
                            REQUEST
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
}
