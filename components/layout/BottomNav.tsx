"use client";
import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Search, User, PenTool, Bookmark, ShoppingBag, Plus } from "lucide-react";
import { useAppMode } from "@/contexts/AppModeContext";
import { useWishlistStore, useCartStore } from "@/lib/store";
import { useFCM } from "@/lib/hooks/useFCM";
import { motion } from "framer-motion";
import { theme } from "@/lib/theme.config";

const RENTALS_LEFT = [
    { icon: Home,     label: "Home",     href: "/rentals" },
    { icon: Search,   label: "Near You", href: "/near-you" },
];
const RENTALS_RIGHT = [
    { icon: ShoppingBag, label: "Cart",  href: "/cart" },
    { icon: User,     label: "Profile",  href: "/profile" },
];

const WRITING_LEFT = [
    { icon: PenTool, label: "Jobs",     href: "/writing" },
];
const WRITING_RIGHT = [
    { icon: User,    label: "Profile",  href: "/profile" },
];

export function BottomNav() {
    useFCM();
    const pathname = usePathname();
    const router = useRouter();
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

    const leftItems = mode === "writing" ? WRITING_LEFT : RENTALS_LEFT;
    const rightItems = mode === "writing" ? WRITING_RIGHT : RENTALS_RIGHT;
    
    // Exact colors requested
    const activeColor = "#0B57D0"; // Blue
    const inactiveColor = "#9CA3AF"; // Gray

    const renderItem = (item: any) => {
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
                    justifyContent: "center",
                    gap: 4,
                    flex: 1,
                    cursor: "pointer",
                    textDecoration: "none",
                    position: "relative",
                    height: "100%",
                }}
            >
                <div style={{ position: "relative", zIndex: 1, transition: "transform 0.15s" }} id={`nav-icon-${item.label}`}>
                    <item.icon
                        style={{
                            width: 24,
                            height: 24,
                            color: isActive ? activeColor : inactiveColor,
                            transform: isActive ? "scale(1.1)" : "scale(1)",
                            transition: "all 0.2s",
                        }}
                        strokeWidth={isActive ? 2.5 : 2}
                    />
                    {item.label === "Cart" && Object.keys(cartItems).length > 0 && (
                        <div style={{ position: "absolute", top: -4, right: -6, background: "#E24B4A", color: "#fff", fontSize: 9, fontWeight: 800, width: 14, height: 14, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {Object.keys(cartItems).length}
                        </div>
                    )}
                </div>

                <span
                    style={{
                        fontSize: 11,
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? activeColor : inactiveColor,
                        letterSpacing: "0.2px",
                        position: "relative",
                        zIndex: 1,
                        transition: "color 0.2s",
                    }}
                >
                    {item.label}
                </span>
            </Link>
        );
    };

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-50 w-full"
            style={{ fontFamily: "'DM Sans', sans-serif", height: 80 }}
        >
            <div
                style={{
                    background: "#FFFFFF",
                    height: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    boxShadow: "0 -4px 20px rgba(0,0,0,0.06)",
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    position: "relative"
                }}
            >
                {/* ── FAUX NOTCH ──
                    This circle creates the visual "bite" into the white navbar,
                    matching the page background perfectly.
                */}
                <div style={{
                    position: "absolute",
                    top: -20,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 76,
                    height: 76,
                    backgroundColor: theme.surface, // #F5F7FA
                    borderRadius: "50%",
                    zIndex: 1,
                }} />

                {/* Left Navigation Items */}
                <div style={{ display: "flex", flex: 2, justifyContent: "space-around", alignItems: "center", height: "100%", zIndex: 2 }}>
                    {leftItems.map(renderItem)}
                </div>
                
                {/* Center FAB */}
                <div style={{ flex: 1.2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 3, height: "100%" }}>
                    <button
                        onClick={() => router.push(mode === "writing" ? "/writing/new" : "/rentals/new")}
                        style={{
                            position: "absolute",
                            top: -28, // Hovering inside the notch
                            width: 58,
                            height: 58,
                            borderRadius: "50%",
                            background: activeColor, // Blue button
                            color: "#fff",
                            border: "none",
                            boxShadow: "0 8px 24px rgba(11,87,208,0.3)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            transition: "transform 0.2s",
                        }}
                    >
                        <Plus size={30} strokeWidth={3} />
                    </button>
                    {/* List Item Label placed below the floating button */}
                    <span style={{ fontSize: 11, fontWeight: 600, color: inactiveColor, position: "absolute", bottom: 12 }}>
                        List Item
                    </span>
                </div>

                {/* Right Navigation Items */}
                <div style={{ display: "flex", flex: 2, justifyContent: "space-around", alignItems: "center", height: "100%", zIndex: 2 }}>
                    {rightItems.map(renderItem)}
                </div>
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
