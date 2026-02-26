"use client";

import { Zap, MapPin, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

// Static urgency items (nearest available based on block context)
const URGENCY_ITEMS = [
    { id: "1", name: "Calculator", location: "A-204", distance: "120m", icon: "🧮" },
    { id: "2", name: "Drafter", location: "B-112", distance: "200m", icon: "📐" },
    { id: "3", name: "Geometry Box", location: "A-305", distance: "90m", icon: "📏" },
];

export function UrgencySection() {
    const router = useRouter();

    return (
        <div className="rounded-2xl overflow-hidden shadow-premium" style={{
            background: "linear-gradient(135deg, hsl(239, 84%, 20%) 0%, hsl(258, 90%, 22%) 100%)",
            border: "1px solid hsl(239, 84%, 35% / 0.4)"
        }}>
            {/* Header */}
            <div className="px-5 pt-5 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="bg-amber-500/20 border border-amber-500/30 p-1.5 rounded-lg">
                        <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-base font-black text-white" style={{ fontFamily: "Outfit, sans-serif" }}>Need it NOW?</h2>
                        <p className="text-[10px] text-indigo-300/60 font-medium">Nearest available items</p>
                    </div>
                </div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">URGENT</span>
            </div>

            {/* Items */}
            <div className="px-5 pb-5 space-y-2.5">
                {URGENCY_ITEMS.map((item) => (
                    <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-xl"
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-2xl w-9 text-center">{item.icon}</span>
                            <div>
                                <p className="font-bold text-white text-sm">{item.name}</p>
                                <div className="flex items-center gap-1 text-indigo-300/60 text-[10px] mt-0.5">
                                    <MapPin className="w-2.5 h-2.5" />
                                    <span>{item.location} · {item.distance}</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => router.push("/rentals")}
                            className="flex items-center gap-1 bg-white/10 hover:bg-white/15 border border-white/15 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all active:scale-95"
                        >
                            Get <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
