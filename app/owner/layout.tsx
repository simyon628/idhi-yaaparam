"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { theme } from "@/lib/theme.config";
import { LayoutDashboard, Image, Users, ArrowLeft, Loader2, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Owner Panel Layout
 *
 * Security: 3-layer protection
 * 1. Firebase Auth — must be logged in
 * 2. isOwner flag — checked on Firestore user document
 * 3. Firestore Rules — server-side enforcement
 *
 * If the user is not an owner, they see "Access Denied" and get
 * redirected to the homepage. No data is ever loaded.
 */
export default function OwnerLayout({ children }: { children: ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [state, setState] = useState<"loading" | "authorized" | "denied">("loading");

    useEffect(() => {
        if (!auth) {
            setState("denied");
            return;
        }

        const unsub = onAuthStateChanged(auth, async (user) => {
            if (!user || !db) {
                setState("denied");
                return;
            }

            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists() && userDoc.data().isOwner === true) {
                    setState("authorized");
                } else {
                    setState("denied");
                }
            } catch {
                setState("denied");
            }
        });

        return () => unsub();
    }, []);

    // Loading state
    if (state === "loading") {
        return (
            <div style={{
                minHeight: "100vh",
                background: theme.brand.gradient,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
                fontFamily: "'DM Sans', sans-serif",
            }}>
                <Loader2 style={{ width: 32, height: 32, color: "#fff", animation: "spin 1s linear infinite" }} />
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 600 }}>Verifying Owner Access...</p>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    // Access denied
    if (state === "denied") {
        return (
            <div style={{
                minHeight: "100vh",
                background: "#F9FAFB",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 20,
                padding: 24,
                fontFamily: "'DM Sans', sans-serif",
            }}>
                <div style={{
                    width: 72, height: 72,
                    borderRadius: 20,
                    background: "linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                    <ShieldAlert style={{ width: 32, height: 32, color: "#EF4444" }} />
                </div>
                <div style={{ textAlign: "center" }}>
                    <h1 style={{ fontSize: 22, fontWeight: 900, color: "#1E293B", fontFamily: "'Syne', sans-serif", marginBottom: 8 }}>
                        Access Denied
                    </h1>
                    <p style={{ color: "#64748B", fontSize: 14, fontWeight: 500, maxWidth: 280, lineHeight: 1.5 }}>
                        This panel is restricted to the platform owner. If you believe this is an error, contact the administrator.
                    </p>
                </div>
                <button
                    onClick={() => router.push("/rentals")}
                    style={{
                        display: "flex", alignItems: "center", gap: 8,
                        background: theme.brand.primary,
                        color: "#fff",
                        border: "none", borderRadius: 12,
                        padding: "12px 24px",
                        fontWeight: 700, fontSize: 14,
                        cursor: "pointer",
                        fontFamily: "'DM Sans', sans-serif",
                    }}
                >
                    <ArrowLeft style={{ width: 16, height: 16 }} />
                    Back to Home
                </button>
            </div>
        );
    }

    // Authorized — render owner panel
    const NAV_ITEMS = [
        { href: "/owner", label: "Dashboard", icon: LayoutDashboard },
        { href: "/owner/banners", label: "Banners", icon: Image },
        { href: "/owner/users", label: "Users", icon: Users },
    ];

    return (
        <div style={{
            minHeight: "100vh",
            background: "#F3F4F6",
            fontFamily: "'DM Sans', sans-serif",
        }}>
            {/* Owner Header */}
            <div style={{
                background: theme.brand.gradient,
                padding: "16px 20px 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
            }}>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push("/rentals")}
                        style={{
                            width: 34, height: 34,
                            background: "rgba(255,255,255,0.15)",
                            border: "1px solid rgba(255,255,255,0.25)",
                            borderRadius: 10,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer",
                        }}
                    >
                        <ArrowLeft style={{ width: 16, height: 16, color: "#fff" }} />
                    </button>
                    <div>
                        <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 16, color: "#fff", lineHeight: 1 }}>
                            Owner Console
                        </div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", letterSpacing: "1.5px", textTransform: "uppercase", marginTop: 2 }}>
                            Idhi Yaaparam
                        </div>
                    </div>
                </div>
                <div style={{
                    padding: "5px 12px",
                    background: "rgba(255,255,255,0.15)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: 20,
                    fontSize: 10,
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.85)",
                    letterSpacing: "0.5px",
                }}>
                    👑 OWNER
                </div>
            </div>

            {/* Tab Navigation */}
            <div style={{
                display: "flex",
                gap: 4,
                padding: "8px 12px",
                background: "#fff",
                borderBottom: "1px solid rgba(0,0,0,0.06)",
            }}>
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            style={{
                                flex: 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 6,
                                padding: "10px 8px",
                                borderRadius: 10,
                                fontSize: 11,
                                fontWeight: isActive ? 800 : 600,
                                textDecoration: "none",
                                transition: "all 0.2s",
                                ...(isActive
                                    ? {
                                        background: theme.brand.primaryPale,
                                        color: theme.brand.primary,
                                    }
                                    : {
                                        background: "transparent",
                                        color: "#94A3B8",
                                    }
                                ),
                            }}
                        >
                            <Icon style={{ width: 14, height: 14 }} />
                            {item.label}
                        </Link>
                    );
                })}
            </div>

            {/* Content */}
            <div style={{ padding: "16px" }}>
                {children}
            </div>
        </div>
    );
}
