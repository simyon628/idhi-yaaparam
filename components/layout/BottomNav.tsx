"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, User, PenTool, Bookmark, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
    const pathname = usePathname();
    const isWritingMode = pathname.startsWith('/writing');

    const NAV_ITEMS = isWritingMode ? [
        { icon: Home, label: "Market", href: "/rentals" },
        { icon: PenTool, label: "Writing", href: "/writing" },
        { icon: User, label: "Profile", href: "/profile" },
    ] : [
        { icon: Home, label: "Home", href: "/home" },
        { icon: Search, label: "Search", href: "/search" },
        { icon: Bookmark, label: "Saved", href: "/wishlist" },
        { icon: Zap, label: "Activity", href: "/activity" },
        { icon: User, label: "Profile", href: "/profile" },
    ];

    return (
        <nav className="fixed mb-4 bottom-0 left-4 right-4 z-50 bg-white/85 backdrop-blur-2xl border border-indigo-100/70 px-3 py-2.5 flex items-center justify-between mx-auto max-w-sm rounded-[2rem] shadow-[0_8px_32px_-8px_rgba(100,110,200,0.25),0_2px_8px_-2px_rgba(100,110,200,0.1)]">
            {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/home" && pathname.startsWith(item.href));

                return (
                    <Link
                        key={item.label}
                        href={item.href}
                        className="flex flex-col items-center gap-1 group relative px-2 py-1 min-w-[52px]"
                    >
                        {/* Active background pill */}
                        {isActive && (
                            <div className="absolute inset-0 bg-indigo-50 rounded-2xl border border-indigo-100" />
                        )}

                        <div className={cn(
                            "relative z-10 p-1.5 rounded-xl transition-all duration-200",
                            isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-indigo-400"
                        )}>
                            <item.icon
                                className={cn(
                                    "w-5 h-5 transition-all duration-200",
                                    isActive && "scale-110"
                                )}
                                strokeWidth={isActive ? 2.5 : 1.8}
                            />
                        </div>

                        <span className={cn(
                            "relative z-10 text-[9px] font-black tracking-wider transition-all duration-200",
                            isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-indigo-400"
                        )}>
                            {item.label}
                        </span>

                        {/* Active dot indicator */}
                        {isActive && (
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-500 rounded-full shadow-sm" />
                        )}
                    </Link>
                );
            })}
        </nav>
    );
}
