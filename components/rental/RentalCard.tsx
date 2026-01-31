"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface RentalCardProps {
    item: {
        id: string;
        name: string;
        price: number;
        icon: string;
        block: string;
    };
}

export function RentalCard({ item }: RentalCardProps) {
    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[1.5rem] p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition-all active:scale-[0.98]">
            <div className="aspect-square bg-zinc-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center relative overflow-hidden">
                <span className="text-4xl">{item.icon}</span>
                <div className="absolute top-2 right-2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm px-2 py-0.5 rounded-lg border border-black/5">
                    <span className="text-[10px] font-black text-primary">₹{item.price}/hr</span>
                </div>
            </div>

            <div className="flex flex-col gap-1 px-1">
                <h3 className="font-black text-zinc-900 dark:text-zinc-100 text-sm truncate">{item.name}</h3>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{item.block}</p>
            </div>

            <Button size="sm" className="w-full h-9 rounded-xl font-bold text-xs bg-zinc-900 hover:bg-zinc-800 text-white shadow-md">
                RENT NOW
            </Button>
        </div>
    );
}
