"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, User, PenTool, Bookmark } from "lucide-react";
import { useAppMode } from "@/contexts/AppModeContext";
import { useFCM } from "@/lib/hooks/useFCM";
import { motion } from "framer-motion";

const RENTALS_NAV = [
    { icon: Home,     label: "Home",    href: "/rentals" },
    { icon: Bookmark, label: "Saved",   href: "/wishlist" },
    { icon: Search,   label: "Request", href: "/requests" },
    { icon: User,     label: "Profile", href: "/profile" },
];

const WRITING_NAV = [
    { icon: PenTool, label: "Jobs",     href: "/writing" },
    { icon: Home,    label: "Post Job", href: "/writing/new" },
    { icon: User,    label: "Profile",  href: "/profile" },
];

export function BottomNav() {
    useFCM();
    const pathname = usePathname();
    const { mode } = useAppMode();

    const items = mode === "writing" ? WRITING_NAV : RENTALS_NAV;
    const accentColor = mode === "writing" ? "#00C48C" : "#7B72FF";

    return (
        <nav
            className="fixed bottom-4 left-3 right-3 z-50 mx-auto max-w-sm"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
            <div
                style={{
                    background: "linear-gradient(135deg,#1E1E30,#252540)",
                    borderRadius: 28,
                    padding: "11px 18px",
                    display: "flex",
                    justifyContent: "space-around",
                    alignItems: "center",
                    boxShadow: "0 10px 48px rgba(0,0,0,.45), 0 0 0 1px rgba(255,255,255,.07), inset 0 1px 0 rgba(255,255,255,.06)",
                }}
            >
                {items.map((item) => {
                    const isActive =
                        pathname === item.href ||
                        (item.href !== "/rentals" &&
                            item.href !== "/writing" &&
                            pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 3,
                                flex: 1,
                                cursor: "pointer",
                                textDecoration: "none",
                                position: "relative",
                            }}
                        >
                            {/* Active glow pill */}
                            {isActive && (
                                <motion.div
                                    layoutId="iy-nav-pill"
                                    style={{
                                        position: "absolute",
                                        inset: "-6px -8px",
                                        borderRadius: 14,
                                        background: mode === "writing"
                                            ? "rgba(0,196,140,0.12)"
                                            : "rgba(123,114,255,0.14)",
                                        zIndex: 0,
                                    }}
                                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                                />
                            )}

                            <div style={{ position: "relative", zIndex: 1, transition: "transform 0.15s" }}>
                                <item.icon
                                    style={{
                                        width: 19,
                                        height: 19,
                                        color: isActive ? accentColor : "rgba(255,255,255,0.32)",
                                        transform: isActive ? "scale(1.12)" : "scale(1)",
                                        transition: "all 0.2s",
                                    }}
                                    strokeWidth={isActive ? 2.5 : 1.8}
                                />
                            </div>

                            <span
                                style={{
                                    fontSize: 10,
                                    fontWeight: isActive ? 800 : 600,
                                    color: isActive ? accentColor : "rgba(255,255,255,0.32)",
                                    letterSpacing: "0.2px",
                                    position: "relative",
                                    zIndex: 1,
                                    transition: "color 0.2s",
                                }}
                            >
                                {item.label}
                            </span>

                            {/* Active dot */}
                            {isActive && (
                                <motion.div
                                    layoutId="iy-nav-dot"
                                    style={{
                                        width: 4,
                                        height: 4,
                                        borderRadius: "50%",
                                        background: accentColor,
                                        marginTop: -1,
                                    }}
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
