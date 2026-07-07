"use client";
import React, { useEffect } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, User, PenTool, Bookmark, ShoppingBag } from "lucide-react";
import { useAppMode } from "@/contexts/AppModeContext";
import { useWishlistStore, useCartStore } from "@/lib/store";
import { useFCM } from "@/lib/hooks/useFCM";
import { motion } from "framer-motion";

import { theme } from "@/lib/theme.config";

const RENTALS_NAV = [
    { icon: Home,     label: "Home",     href: "/rentals" },
    { icon: Search,   label: "Near You", href: "/near-you" },
    { icon: ShoppingBag, label: "Cart",  href: "/cart" },
    { icon: User,     label: "Profile",  href: "/profile" },
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
    const { items: cartItems } = useCartStore();

    useEffect(() => {
        const handleCartBounce = () => {
            const el = document.getElementById("nav-icon-Cart");
            if (el) {
                el.style.animation = "none";
                void el.offsetWidth; // trigger reflow
                el.style.animation = "cartBounce 300ms ease-in-out";
            }
        };
        window.addEventListener('cart-bounce', handleCartBounce);
        return () => window.removeEventListener('cart-bounce', handleCartBounce);
    }, []);

    const items = mode === "writing" ? WRITING_NAV : RENTALS_NAV;
    // Always use the theme brand primary color now
    const accentColor = theme.bottomNav.activeColor;

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-50 w-full"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
            <div
                style={{
                    background: theme.bottomNav.bg,
                    padding: "11px 18px",
                    display: "flex",
                    justifyContent: "space-around",
                    alignItems: "center",
                    boxShadow: "0 -4px 20px rgba(0,0,0,.05)",
                    borderTop: "1px solid rgba(0,0,0,0.05)",
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
                                        background: theme.bottomNav.activeGlow,
                                        zIndex: 0,
                                    }}
                                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                                />
                            )}

                            <div style={{ position: "relative", zIndex: 1, transition: "transform 0.15s" }} id={`nav-icon-${item.label}`}>
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
                                {item.label === "Cart" && Object.keys(cartItems).length > 0 && (
                                    <div style={{ position: "absolute", top: -4, right: -6, background: "#E24B4A", color: "#fff", fontSize: 9, fontWeight: 800, width: 14, height: 14, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        {Object.keys(cartItems).length}
                                    </div>
                                )}
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
            <style>{`
                @keyframes cartBounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-4px); }
                }
            `}</style>
        </nav>
    );
}
