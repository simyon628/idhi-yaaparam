"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Search, User, PenTool, Bookmark, Zap, ShoppingBag, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppMode } from "@/contexts/AppModeContext";
import { motion } from "framer-motion";

const RENTALS_NAV = [
    { icon: Home, label: "Home", href: "/rentals" },
    { icon: Search, label: "Search", href: "/search" },
    { icon: Bookmark, label: "Saved", href: "/wishlist" },
    { icon: Zap, label: "Activity", href: "/activity" },
    { icon: User, label: "Profile", href: "/profile" },
];

const WRITING_NAV = [
    { icon: PenTool, label: "Jobs", href: "/writing" },
    { icon: Home, label: "Post Job", href: "/writing/new" },
    { icon: User, label: "Profile", href: "/profile" },
];

export function BottomNav() {
    const pathname = usePathname();
    const router = useRouter();
    const { mode, setMode } = useAppMode();

    const items = mode === "writing" ? WRITING_NAV : RENTALS_NAV;

    return (
        <nav className="fixed bottom-4 left-3 right-3 z-50 mx-auto max-w-sm">
            {/* Mode switcher strip at top */}
            <div className="flex items-center justify-center gap-2 mb-2">
                <button
                    onClick={() => { setMode("rentals"); router.push("/rentals"); }}
                    className={cn(
                        "flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border transition-all",
                        mode === "rentals"
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                            : "bg-slate-900/80 text-slate-400 border-slate-700"
                    )}
                >
                    <ShoppingBag className="w-2.5 h-2.5" /> Rentals
                </button>
                <button
                    onClick={() => { setMode("writing"); router.push("/writing"); }}
                    className={cn(
                        "flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border transition-all",
                        mode === "writing"
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                            : "bg-slate-900/80 text-slate-400 border-slate-700"
                    )}
                >
                    <PenTool className="w-2.5 h-2.5" /> Writing
                </button>
            </div>

            {/* Main nav bar */}
            <div className="bg-slate-900/95 backdrop-blur-2xl border border-slate-700/60 px-3 py-2.5 flex items-center justify-around rounded-[2rem] shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05)]">
                {items.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/rentals" && item.href !== "/writing" && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className="flex flex-col items-center gap-1 relative px-3 py-1 min-w-[44px] group"
                        >
                            {/* Active pill bg */}
                            {isActive && (
                                <motion.div
                                    layoutId="nav-active-pill"
                                    className="absolute inset-0 rounded-2xl"
                                    style={{ background: mode === "writing" ? "rgba(16,185,129,0.15)" : "rgba(99,102,241,0.18)" }}
                                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                                />
                            )}

                            <div className={cn(
                                "relative z-10 transition-all duration-200",
                                isActive
                                    ? mode === "writing" ? "text-emerald-400" : "text-indigo-400"
                                    : "text-slate-500 group-hover:text-slate-300"
                            )}>
                                <item.icon
                                    className={cn("w-5 h-5 transition-all duration-200", isActive && "scale-110")}
                                    strokeWidth={isActive ? 2.5 : 1.8}
                                />
                            </div>

                            <span className={cn(
                                "relative z-10 text-[9px] font-black tracking-wider transition-all duration-200",
                                isActive
                                    ? mode === "writing" ? "text-emerald-400" : "text-indigo-400"
                                    : "text-slate-600 group-hover:text-slate-400"
                            )}>
                                {item.label}
                            </span>

                            {/* Active dot */}
                            {isActive && (
                                <motion.div
                                    layoutId="nav-dot"
                                    className={cn("absolute -bottom-0.5 w-1 h-1 rounded-full", mode === "writing" ? "bg-emerald-400" : "bg-indigo-400")}
                                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                                />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
