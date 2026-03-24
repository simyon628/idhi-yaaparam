import React from "react";
import Link from "next/link";

export const CATEGORIES = [
    { id: "calculator",  name: "Calculator",        icon: "🖩", sub: "Scientific & Basic",   badge: "14 items",  cc: { ico: "#ECEAFF", blob: "#5548E8", bdg: { bg: "#ECEAFF", cl: "#5548E8" } } },
    { id: "drafter",     name: "Drafter",            icon: "📐", sub: "Mini & Large size",    badge: "8 items",   cc: { ico: "#FFF4E0", blob: "#FF9500", bdg: { bg: "#FFF4E0", cl: "#B36200" } } },
    { id: "lab-coat",    name: "Lab Coat",           icon: "🥼", sub: "S, M, L, XL sizes",   badge: "22 items",  cc: { ico: "#DAFFF3", blob: "#00C48C", bdg: { bg: "#DAFFF3", cl: "#007A55" } } },
    { id: "geometry",    name: "Geometry Set",       icon: "📏", sub: "Complete kit",         badge: "17 items",  cc: { ico: "#E2F6FF", blob: "#2CB8FF", bdg: { bg: "#E2F6FF", cl: "#006EA8" } } },
    { id: "electronics", name: "Electronic Gadgets", icon: "💻", sub: "Laptops & gadgets",    badge: "5 items",   cc: { ico: "#FFECEC", blob: "#FF5F5F", bdg: { bg: "#FFECEC", cl: "#C03030" } } },
    { id: "books",       name: "Books / Notes",      icon: "📚", sub: "All branches",         badge: "63 items",  cc: { ico: "#FFE8F3", blob: "#FF4D8D", bdg: { bg: "#FFE8F3", cl: "#B01866" } } },
    { id: "others",      name: "Others",             icon: "📦", sub: "Miscellaneous items",  badge: "More",      cc: { ico: "#ECEAFF", blob: "#5548E8", bdg: { bg: "#ECEAFF", cl: "#5548E8" } } },
];

interface CategoryGridProps {
    counts?: Record<string, number>;
    loading?: boolean;
}

export function CategoryGrid({ counts = {}, loading = false }: CategoryGridProps) {
    return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11, paddingBottom: 12 }}>
            {CATEGORIES.map((cat) => {
                const count = counts[cat.id] || 0;
                const badgeText = loading ? "..." : count > 0 ? `✦ ${count} available` : `✦ ${cat.badge}`;

                return (
                    <Link
                        key={cat.id}
                        href={`/search?category=${cat.id}`}
                        className="iy-cat-card"
                        style={{
                            background: "#fff",
                            borderRadius: 24,
                            padding: "18px 15px 15px",
                            boxShadow: "0 2px 14px rgba(13,13,30,0.07), 0 0 0 1px rgba(85,72,232,0.06)",
                            cursor: "pointer",
                            position: "relative",
                            overflow: "hidden",
                            textDecoration: "none",
                            display: "block",
                            "--glow-color": cat.cc.blob,
                        } as React.CSSProperties}
                    >
                        {/* Background blob */}
                        <div style={{
                            position: "absolute",
                            bottom: -18,
                            right: -18,
                            width: 72,
                            height: 72,
                            borderRadius: "50%",
                            background: cat.cc.blob,
                            opacity: 0.09,
                        }} />

                        {/* Arrow */}
                        <div style={{
                            position: "absolute",
                            top: 14,
                            right: 12,
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            background: "var(--iy-surface)",
                            color: "var(--iy-text2)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 13,
                            fontWeight: 700,
                        }}>›</div>

                        {/* Icon */}
                        <div style={{
                            width: 48,
                            height: 48,
                            borderRadius: 14,
                            background: cat.cc.ico,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 26,
                            marginBottom: 12,
                        }}>
                            {cat.icon}
                        </div>

                        {/* Name */}
                        <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 14, color: "var(--iy-text1)", marginBottom: 3 }}>
                            {cat.name}
                        </div>

                        {/* Sub */}
                        <div style={{ fontSize: 11, color: "var(--iy-text3)", fontWeight: 500, marginBottom: 10 }}>
                            {cat.sub}
                        </div>

                        {/* Badge */}
                        <div style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "4px 9px",
                            borderRadius: 20,
                            background: cat.cc.bdg.bg,
                            color: cat.cc.bdg.cl,
                        }}>
                            {badgeText}
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}
