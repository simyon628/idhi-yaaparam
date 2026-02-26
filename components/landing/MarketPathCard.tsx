"use client";

import Link from "next/link";

interface MarketPathCardProps {
    type: "rent" | "buy";
}

const RENT_ITEMS = [
    { icon: "🧮", name: "Casio fx-991", price: "₹20/hr" },
    { icon: "📐", name: "Mini Drafter", price: "₹50/hr" },
    { icon: "⚡", name: "Multimeter", price: "₹40/hr" },
];

const BUY_ITEMS = [
    { icon: "📖", name: "Engg. Mechanics", price: "₹250" },
    { icon: "📚", name: "3rd Sem Notes", price: "₹80" },
    { icon: "📓", name: "Lab Manual", price: "₹60" },
];

export function MarketPathCard({ type }: MarketPathCardProps) {
    const isRent = type === "rent";

    const config = {
        rent: {
            emoji: "⚡",
            label: "Elite Rentals",
            tag: "Short-term · Pay per use",
            headline: "Need it now?",
            sub: "Borrow it from a classmate, pay by the hour.",
            cta: "Browse Rentals",
            href: "/login",
            items: RENT_ITEMS,
            gradient:
                "linear-gradient(135deg, hsl(239 84% 67%) 0%, hsl(180 70% 50%) 100%)",
            bgColor: "rgba(79,70,229,0.08)",
            border: "rgba(99,102,241,0.25)",
            badgeBg: "rgba(99,102,241,0.15)",
            badgeText: "hsl(239 84% 80%)",
            ctaBg: "linear-gradient(135deg, hsl(239 84% 67%), hsl(258 90% 66%))",
            ctaShadow: "0 6px 16px rgba(79,70,229,0.35)",
            iconSrc: "⚡",
        },
        buy: {
            emoji: "📘",
            label: "Campus Trade",
            tag: "Permanent · Yours forever",
            headline: "Live it. Keep it.",
            sub: "Buy textbooks and guides from seniors at a fraction of the price.",
            cta: "Browse Buy/Sell",
            href: "/login",
            items: BUY_ITEMS,
            gradient:
                "linear-gradient(135deg, hsl(43 96% 56%) 0%, hsl(30 95% 55%) 100%)",
            bgColor: "rgba(245,158,11,0.08)",
            border: "rgba(245,158,11,0.25)",
            badgeBg: "rgba(245,158,11,0.15)",
            badgeText: "hsl(43 80% 70%)",
            ctaBg: "linear-gradient(135deg, hsl(43 96% 56%), hsl(30 95% 50%))",
            ctaShadow: "0 6px 16px rgba(245,158,11,0.35)",
            iconSrc: "📘",
        },
    }[type];

    return (
        <div
            className="rounded-3xl p-5"
            style={{
                background: config.bgColor,
                border: `1px solid ${config.border}`,
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <div
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold mb-2"
                        style={{ background: config.badgeBg, color: config.badgeText }}
                    >
                        {config.emoji} {config.label}
                    </div>
                    <p
                        className="text-[10px] font-medium uppercase tracking-widest"
                        style={{ color: "hsl(215 20% 50%)" }}
                    >
                        {config.tag}
                    </p>
                </div>
                <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-md"
                    style={{ background: config.gradient }}
                >
                    {isRent ? "⚡" : "📘"}
                </div>
            </div>

            {/* Headline */}
            <h3 className="text-xl font-black text-foreground mb-1">{config.headline}</h3>
            <p className="text-sm mb-4 leading-relaxed" style={{ color: "hsl(215 20% 55%)" }}>
                {config.sub}
            </p>

            {/* Item mini-list */}
            <div className="space-y-2 mb-5">
                {config.items.map((item) => (
                    <div
                        key={item.name}
                        className="flex items-center justify-between rounded-xl px-3 py-2.5"
                        style={{
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.08)",
                        }}
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-lg">{item.icon}</span>
                            <span
                                className="text-sm font-semibold"
                                style={{ color: "hsl(210 40% 90%)" }}
                            >
                                {item.name}
                            </span>
                        </div>
                        <span className="text-sm font-bold" style={{ color: config.badgeText }}>
                            {item.price}
                        </span>
                    </div>
                ))}
            </div>

            {/* CTA */}
            <Link
                id={`market-path-${type}-btn`}
                href={config.href}
                className="w-full py-3 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-95"
                style={{ background: config.ctaBg, boxShadow: config.ctaShadow }}
            >
                {config.cta} →
            </Link>
        </div>
    );
}
