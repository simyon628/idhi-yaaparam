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
        <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-slate-700/50 px-4 py-3 flex items-center justify-between max-w-md mx-auto">
            {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;

                if (item.primary) {
                    return (
                        <Link key={item.label} href={item.href} className="relative -top-4">
                            <div className="w-14 h-14 rounded-2xl gradient-indigo flex items-center justify-center shadow-indigo active:scale-95 transition-all">
                                <item.icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                            </div>
                        </Link>
                    );
                }

                return (
                    <Link
                        key={item.label}
                        href={item.href}
                        className="flex flex-col items-center gap-1 group relative py-1 px-2"
                    >
                        <item.icon
                            className={cn(
                                "w-5 h-5 transition-all duration-200",
                                isActive ? "text-indigo-400 scale-110" : "text-slate-600 group-hover:text-slate-400"
                            )}
                        />
                        <span className={cn(
                            "text-[9px] font-bold uppercase tracking-widest transition-all",
                            isActive ? "text-indigo-400" : "text-slate-600 group-hover:text-slate-400"
                        )}>
                            {item.label}
                        </span>
                        {isActive && (
                            <div className="absolute -bottom-0.5 w-1 h-1 bg-indigo-400 rounded-full" />
                        )}
                    </Link>
                );
            })}
        </nav>
    );
}
