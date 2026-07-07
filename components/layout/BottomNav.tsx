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
    { icon: Search,   label: "Near",     href: "/near-you" },
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
    
    const accentColor = theme.bottomNav.activeColor;
    const inactiveColor = theme.bottomNav.inactiveColor;

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
                    gap: 4,
                    flex: 1,
                    cursor: "pointer",
                    textDecoration: "none",
                    position: "relative",
                }}
            >
                <div style={{ position: "relative", zIndex: 1, transition: "transform 0.15s" }} id={`nav-icon-${item.label}`}>
                    <item.icon
                        style={{
                            width: 22,
                            height: 22,
                            color: isActive ? accentColor : inactiveColor,
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
                        fontSize: 10,
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? accentColor : inactiveColor,
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
            style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
            <div
                style={{
                    background: theme.bottomNav.bg,
                    padding: "12px 16px 20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                    boxShadow: (theme as any).shadows?.bottomNav || "0 -4px 20px rgba(0,0,0,.08)",
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    position: "relative"
                }}
            >
                <div style={{ display: "flex", flex: 2, justifyContent: "space-around", alignItems: "center" }}>
                    {leftItems.map(renderItem)}
                </div>
                
                {/* Center FAB */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative", bottom: 12 }}>
                    <button
                        onClick={() => router.push(mode === "writing" ? "/writing/new" : "/rentals/new")}
                        style={{
                            width: 56,
                            height: 56,
                            borderRadius: "50%",
                            background: theme.brand.primary,
                            color: "#fff",
                            border: "none",
                            boxShadow: "0 8px 24px rgba(11,87,208,0.3)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            marginBottom: 4,
                        }}
                    >
                        <Plus size={28} strokeWidth={2.5} />
                    </button>
                    <span style={{ fontSize: 11, fontWeight: 600, color: inactiveColor }}>
                        List Item
                    </span>
                </div>

                <div style={{ display: "flex", flex: 2, justifyContent: "space-around", alignItems: "center" }}>
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
