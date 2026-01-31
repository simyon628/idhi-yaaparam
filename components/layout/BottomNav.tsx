"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
    { icon: Home, label: "Home", href: "/home" },
    { icon: Search, label: "Search", href: "/rentals" },
    { icon: MessageCircle, label: "Chat", href: "/chat" },
    { icon: User, label: "Profile", href: "/profile" },
];

export function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-zinc-100 dark:border-zinc-800 px-6 py-3 flex items-center justify-between max-w-md mx-auto rounded-t-[2rem]">
            {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                    <Link
                        key={item.label}
                        href={item.href}
                        className="flex flex-col items-center gap-1 group relative py-1 px-3"
                    >
                        <item.icon
                            className={cn(
                                "w-6 h-6 transition-all duration-300",
                                isActive ? "text-primary scale-110" : "text-zinc-400 group-hover:text-zinc-600"
                            )}
                        />
                        <span className={cn(
                            "text-[10px] font-bold uppercase tracking-widest transition-all",
                            isActive ? "text-primary opacity-100" : "text-zinc-400 opacity-60 group-hover:opacity-100"
                        )}>
                            {item.label}
                        </span>
                        {isActive && (
                            <div className="absolute -bottom-1 w-6 h-1 bg-primary rounded-full animate-in fade-in zoom-in" />
                        )}
                    </Link>
                );
            })}
        </nav>
    );
}
