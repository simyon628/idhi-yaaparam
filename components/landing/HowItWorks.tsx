"use client";

const STEPS = {
    borrower: [
        { icon: "🔍", step: "Search", desc: "Find items by block or category" },
        { icon: "💳", step: "Request & Pay", desc: "Send a rental request in seconds" },
        { icon: "📦", step: "Use & Return", desc: "Pick up, use, and return easily" },
    ],
    lender: [
        { icon: "📝", step: "List", desc: "Post your idle item in 30 seconds" },
        { icon: "✅", step: "Approve", desc: "Confirm the request from your phone" },
        { icon: "💰", step: "Earn", desc: "Get paid directly to your UPI" },
    ],
};

export function HowItWorks() {
    return (
        <section id="how-it-works" className="px-6 py-10">
            <div className="text-center mb-8">
                <div
                    className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider mb-3"
                    style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "hsl(215 20% 55%)",
                    }}
                >
                    Simple Process
                </div>
                <h2 className="text-3xl font-black text-foreground leading-tight">
                    How It Works
                </h2>
            </div>

            <div className="space-y-6">
                {/* Borrowers */}
                <div
                    className="rounded-3xl p-5"
                    style={{
                        background: "rgba(79,70,229,0.08)",
                        border: "1px solid rgba(99,102,241,0.2)",
                    }}
                >
                    <div className="flex items-center gap-2 mb-4">
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-base"
                            style={{ background: "linear-gradient(135deg, hsl(239 84% 67%), hsl(258 90% 66%))" }}
                        >
                            🎓
                        </div>
                        <div>
                            <p
                                className="text-xs font-bold uppercase tracking-widest"
                                style={{ color: "hsl(239 84% 75%)" }}
                            >
                                Borrowers
                            </p>
                            <p className="text-xs" style={{ color: "hsl(215 20% 50%)" }}>
                                I need something
                            </p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {STEPS.borrower.map((s, i) => (
                            <div key={s.step} className="flex items-center gap-3">
                                <div
                                    className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                                    style={{ background: "rgba(99,102,241,0.15)" }}
                                >
                                    {s.icon}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-foreground">{s.step}</p>
                                    <p className="text-xs" style={{ color: "hsl(215 20% 50%)" }}>
                                        {s.desc}
                                    </p>
                                </div>
                                {i < STEPS.borrower.length - 1 && (
                                    <span
                                        className="text-lg ml-auto"
                                        style={{ color: "rgba(255,255,255,0.2)" }}
                                    >
                                        ↓
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Lenders */}
                <div
                    className="rounded-3xl p-5"
                    style={{
                        background: "rgba(245,158,11,0.08)",
                        border: "1px solid rgba(245,158,11,0.2)",
                    }}
                >
                    <div className="flex items-center gap-2 mb-4">
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-base"
                            style={{ background: "linear-gradient(135deg, hsl(43 96% 56%), hsl(30 95% 50%))" }}
                        >
                            💼
                        </div>
                        <div>
                            <p
                                className="text-xs font-bold uppercase tracking-widest"
                                style={{ color: "hsl(43 80% 65%)" }}
                            >
                                Lenders
                            </p>
                            <p className="text-xs" style={{ color: "hsl(215 20% 50%)" }}>
                                I have something to offer
                            </p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {STEPS.lender.map((s, i) => (
                            <div key={s.step} className="flex items-center gap-3">
                                <div
                                    className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                                    style={{ background: "rgba(245,158,11,0.15)" }}
                                >
                                    {s.icon}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-foreground">{s.step}</p>
                                    <p className="text-xs" style={{ color: "hsl(215 20% 50%)" }}>
                                        {s.desc}
                                    </p>
                                </div>
                                {i < STEPS.lender.length - 1 && (
                                    <span
                                        className="text-lg ml-auto"
                                        style={{ color: "rgba(255,255,255,0.2)" }}
                                    >
                                        ↓
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
