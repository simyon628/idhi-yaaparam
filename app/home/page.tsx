"use client";

import { useState } from "react";
import { ContextBar } from "@/components/layout/ContextBar";
import { UrgencySection } from "@/components/rental/UrgencySection";
import { BlockBrowser } from "@/components/rental/BlockBrowser";
import { RentalCard } from "@/components/rental/RentalCard";
import { BottomNav } from "@/components/layout/BottomNav";

const MOCK_RENTALS = [
    { id: "1", name: "Casio fx-991ES", price: 20, icon: "🧮", block: "Block A" },
    { id: "2", name: "Mini Drafter", price: 50, icon: "📐", block: "Block B" },
    { id: "3", name: "Geometry Box", price: 15, icon: "📏", block: "Block A" },
    { id: "4", name: "Steel Scale", price: 10, icon: "📏", block: "Block C" },
    { id: "5", name: "Lab Manual", price: 30, icon: "📓", block: "Block B" },
    { id: "6", name: "Multimeter", price: 40, icon: "⚡", block: "Block D" },
];

export default function HomePage() {
    const [activeBlock, setActiveBlock] = useState("A");

    return (
        <div className="flex-1 flex flex-col pb-32">
            {/* Fixed Context Bar */}
            <ContextBar block={`Block ${activeBlock} – Lab L2`} labTime="18 min" />

            {/* Main Content Area */}
            <div className="mt-24 px-6 space-y-10">
                {/* Section 1: Urgency */}
                <UrgencySection />

                {/* Section 2: Block Browser */}
                <div className="space-y-4">
                    <div className="flex items-end justify-between">
                        <h2 className="text-2xl font-black text-zinc-900 leading-none">Browse Blocks</h2>
                        <span className="text-xs font-bold text-primary uppercase tracking-widest">See All</span>
                    </div>
                    <BlockBrowser activeBlock={activeBlock} onBlockChange={setActiveBlock} />
                </div>

                {/* Section 3: 2x2 Grid */}
                <div className="space-y-6">
                    <div className="flex items-end justify-between">
                        <h2 className="text-2xl font-black text-zinc-900 leading-none">Available Near You</h2>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest bg-zinc-100 px-2 py-1 rounded-md">12 Results</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {MOCK_RENTALS.map((rental) => (
                            <RentalCard key={rental.id} item={rental} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Persistent Bottom Nav */}
            <BottomNav />
        </div>
    );
}
