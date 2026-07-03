"use client";
import React from "react";
import { Calculator, ShoppingBag, PenTool } from "lucide-react";
import { motion } from "framer-motion";

export function HomeHero() {
    const CARDS = [
        {
            id: "rent",
            title: "Rent Lab Coat",
            subtitle: "Starting at ₹20/hr",
            icon: Calculator,
            color: "bg-indigo-50",
            iconColor: "text-indigo-600",
        },
        {
            id: "write",
            title: "Need Assignment Help",
            subtitle: "Fast delivery",
            icon: PenTool,
            color: "bg-emerald-50",
            iconColor: "text-emerald-600",
        },
        {
            id: "sell",
            title: "Buy & Sell Electronics",
            subtitle: "Drafters, Calcs...",
            icon: ShoppingBag,
            color: "bg-amber-50",
            iconColor: "text-amber-600",
        },
    ];

    return (
        <div className="w-full overflow-x-auto no-scrollbar py-4 px-4 flex gap-3 snap-x">
            {CARDS.map((card) => (
                <motion.div
                    whileTap={{ scale: 0.98 }}
                    key={card.id}
                    className={`flex items-center gap-3 min-w-[240px] p-4 rounded-2xl border border-gray-100 shadow-sm shrink-0 snap-start bg-white`}
                >
                    <div className={`p-3 rounded-xl ${card.color}`}>
                        <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-sm text-gray-900">{card.title}</span>
                        <span className="text-xs text-gray-500">{card.subtitle}</span>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
