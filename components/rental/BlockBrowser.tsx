"use client";

import { cn } from "@/lib/utils";

const BLOCKS = [
    { id: "A", name: "Block A", count: 12 },
    { id: "B", name: "Block B", count: 9 },
    { id: "C", name: "Block C", count: 7 },
    { id: "D", name: "Block D", count: 4 },
    { id: "Hostel", name: "Hostels", count: 15 },
];

interface BlockBrowserProps {
    activeBlock: string;
    onBlockChange: (id: string) => void;
}

export function BlockBrowser({ activeBlock, onBlockChange }: BlockBrowserProps) {
    return (
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2 -mx-6 px-6">
            {BLOCKS.map((block) => (
                <button
                    key={block.id}
                    onClick={() => onBlockChange(block.id)}
                    className={cn(
                        "flex-shrink-0 px-5 py-3 rounded-2xl transition-all duration-300 flex flex-col items-start gap-1 min-w-[110px]",
                        activeBlock === block.id
                            ? "bg-zinc-900 text-white shadow-lg shadow-zinc-200 dark:shadow-none scale-105"
                            : "bg-white text-zinc-500 border border-zinc-100 shadow-sm"
                    )}
                >
                    <span className="text-xs font-bold uppercase tracking-widest leading-none opacity-60">
                        {block.id === "Hostel" ? "Area" : "Block"}
                    </span>
                    <div className="flex items-center justify-between w-full gap-2">
                        <span className="text-sm font-black whitespace-nowrap">{block.name}</span>
                        <span className={cn(
                            "text-[10px] font-bold px-1.5 py-0.5 rounded-md",
                            activeBlock === block.id ? "bg-primary text-white" : "bg-zinc-100 text-zinc-500"
                        )}>
                            {block.count}
                        </span>
                    </div>
                    {activeBlock === block.id && (
                        <div className="w-8 h-1 bg-primary rounded-full mt-1" />
                    )}
                </button>
            ))}
        </div>
    );
}
