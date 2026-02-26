"use client";

import Link from "next/link";

export function LandingFooterCTA() {
    return (
        <section className="px-6 pb-16">
            {/* PWA Install Section */}
            <div
                className="relative overflow-hidden rounded-3xl p-6 text-center mb-6"
                style={{
                    background: "linear-gradient(135deg, hsl(239 84% 50%) 0%, hsl(258 90% 55%) 100%)",
                    boxShadow: "0 20px 40px rgba(79,70,229,0.4)",
                }}
            >
                {/* Background decoration */}
                <div
                    aria-hidden
                    className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-15"
                    style={{ background: "white", transform: "translate(30%, -30%)" }}
                />
                <div
                    aria-hidden
                    className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-10"
                    style={{ background: "white", transform: "translate(-30%, 30%)" }}
                />

                <div className="relative z-10">
                    <div className="text-4xl mb-3">📱</div>
                    <h3 className="text-xl font-black text-white mb-2">
                        Install on Your Phone
                    </h3>
                    <p className="text-sm mb-5 leading-relaxed" style={{ color: "rgba(255,255,255,0.8)" }}>
                        Add to Home Screen for instant access. Works offline. Blazing fast.
                    </p>
                    <Link
                        id="landing-get-started-btn"
                        href="/login"
                        className="inline-flex items-center gap-2 font-black text-sm px-6 py-3 rounded-2xl transition-transform active:scale-95"
                        style={{
                            background: "rgba(255,255,255,0.95)",
                            color: "hsl(239 84% 55%)",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                        }}
                    >
                        🚀 Get Started — It&apos;s Free
                    </Link>
                </div>
            </div>

            {/* Footer links */}
            <div
                className="flex items-center justify-center gap-6 text-xs font-medium"
                style={{ color: "hsl(215 20% 45%)" }}
            >
                <span>Idhi Yaaparam © 2025</span>
                <span>·</span>
                <Link
                    href="/login"
                    className="transition-colors"
                    style={{ color: "hsl(215 20% 45%)" }}
                >
                    Login
                </Link>
                <span>·</span>
                <Link
                    href="/login"
                    className="transition-colors"
                    style={{ color: "hsl(215 20% 45%)" }}
                >
                    Sign Up
                </Link>
            </div>
        </section>
    );
}
