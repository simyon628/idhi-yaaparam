"use client";

import Link from "next/link";

export function LandingHero() {
    return (
        <section className="relative overflow-hidden pt-16 pb-10 px-6 flex flex-col items-center text-center">
            {/* Background gradient blobs */}
            <div
                aria-hidden="true"
                className="absolute -top-20 -left-20 w-80 h-80 rounded-full opacity-20 pointer-events-none"
                style={{
                    background:
                        "radial-gradient(circle, hsl(239 84% 67%) 0%, transparent 70%)",
                }}
            />
            <div
                aria-hidden="true"
                className="absolute top-10 -right-16 w-64 h-64 rounded-full opacity-10 pointer-events-none"
                style={{
                    background:
                        "radial-gradient(circle, hsl(258 90% 66%) 0%, transparent 70%)",
                }}
            />

            {/* Floating icon card */}
            <div className="relative mb-8 w-40 h-40 flex items-center justify-center">
                {/* Glass card */}
                <div
                    className="absolute inset-0 rounded-3xl"
                    style={{
                        background:
                            "linear-gradient(135deg, rgba(79,70,229,0.2) 0%, rgba(139,92,246,0.15) 100%)",
                        backdropFilter: "blur(12px)",
                        border: "1px solid rgba(99,102,241,0.3)",
                        boxShadow: "0 20px 40px rgba(79,70,229,0.25)",
                    }}
                />
                {/* Orbiting icons */}
                <span
                    className="absolute -top-3 -right-3 text-3xl"
                    style={{ animation: "float 3s ease-in-out infinite" }}
                >
                    💻
                </span>
                <span
                    className="absolute -bottom-3 -left-3 text-2xl"
                    style={{ animation: "float 3s ease-in-out infinite 1s" }}
                >
                    🚲
                </span>
                <span
                    className="absolute top-1 -left-5 text-2xl"
                    style={{ animation: "float 3s ease-in-out infinite 2s" }}
                >
                    📷
                </span>
                {/* Center icon */}
                <span className="text-5xl relative z-10">📦</span>
            </div>

            {/* Badge */}
            <div
                className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider"
                style={{
                    background: "rgba(99,102,241,0.15)",
                    border: "1px solid rgba(99,102,241,0.3)",
                    color: "hsl(239 84% 80%)",
                }}
            >
                <span
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ background: "hsl(239 84% 67%)" }}
                />
                Campus Marketplace
            </div>

            {/* Headline */}
            <h1 className="text-4xl font-black leading-none mb-3 text-foreground">
                Rent Anything{" "}
                <span
                    style={{
                        background: "linear-gradient(135deg, hsl(239 84% 67%), hsl(258 90% 70%))",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                    }}
                >
                    on Campus.
                </span>
                <br />
                <span className="text-3xl font-extrabold">Effortlessly.</span>
            </h1>

            {/* Sub-headline */}
            <p
                className="text-base font-medium leading-relaxed mb-8 max-w-xs"
                style={{ color: "hsl(215 20% 60%)" }}
            >
                Turn your idle items into income and find what you need{" "}
                <span
                    className="font-bold"
                    style={{ color: "hsl(239 84% 72%)" }}
                >
                    right next door.
                </span>
            </p>

            {/* CTAs */}
            <div className="flex flex-col w-full gap-3 max-w-xs">
                <Link
                    id="hero-explore-btn"
                    href="/login"
                    className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 transition-transform active:scale-95"
                    style={{
                        background: "linear-gradient(135deg, hsl(239 84% 67%) 0%, hsl(258 90% 66%) 100%)",
                        boxShadow: "0 8px 20px rgba(79,70,229,0.4)",
                    }}
                >
                    🚀 Explore Marketplace
                </Link>
                <a
                    id="hero-how-it-works-btn"
                    href="#how-it-works"
                    className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-colors"
                    style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        color: "hsl(210 40% 85%)",
                    }}
                >
                    ✨ How It Works
                </a>
            </div>

            {/* Social proof */}
            <p className="mt-6 text-xs font-medium" style={{ color: "hsl(215 20% 50%)" }}>
                ⭐ Trusted by 200+ students · 100% campus-local
            </p>

            <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
        </section>
    );
}
