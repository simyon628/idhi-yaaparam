"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Plus, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
    { icon: Home, label: "Home", href: "/home" },
    { icon: Search, label: "Browse", href: "/rentals" },
    { icon: Plus, label: "List", href: "/rentals/new", primary: true },
    { icon: MessageCircle, label: "Chat", href: "/chat" },
    { icon: User, label: "Profile", href: "/profile" },
];

export function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed mb-6 bottom-0 left-4 right-4 z-50 bg-white/80 backdrop-blur-xl border border-indigo-100 px-6 py-4 flex items-center justify-between mx-auto max-w-sm rounded-[2rem] shadow-[0_10px_40px_-10px_rgba(110,115,200,0.3)]">
            {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;

                // For the central Plus button, if needed
                if (item.primary) {
                    return null; // I moved the central CTA to a floating FAB on the page
                }

                return (
                    <Link
                        key={item.label}
                        href={item.href}
                        className="flex flex-col items-center gap-1.5 group relative px-2"
                    >
                        <div className={cn(
                            "p-2 rounded-2xl transition-all duration-300 relative",
                            isActive ? "bg-indigo-50 text-indigo-600 shadow-sm" : "text-slate-400 group-hover:text-indigo-400 group-hover:bg-slate-50"
                        )}>
                            <item.icon
                                className={cn(
                                    "w-5 h-5 transition-transform duration-300",
                                    isActive && "scale-110"
                                )}
                                strokeWidth={isActive ? 2.5 : 2}
                            />
                            {isActive && (
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                            )}
                        </div>
                        {/* 
                        <span className={cn(
                            "text-[10px] font-bold tracking-wide transition-all",
                            isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-indigo-400"
                        )}>
                            {item.label}
                        </span>
                        */}
                    </Link>
                );
            })}
        </nav>
    );
}
