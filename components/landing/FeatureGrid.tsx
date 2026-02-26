"use client";

const FEATURES = [
    {
        icon: "🏃",
        title: "Local & Fast",
        desc: "No shipping. Just walk 5 minutes.",
        bgColor: "rgba(79,70,229,0.08)",
        border: "rgba(99,102,241,0.2)",
        iconBg: "rgba(99,102,241,0.15)",
        wide: true,
    },
    {
        icon: "🔒",
        title: "Verified Only",
        desc: "Campus members only.",
        bgColor: "rgba(16,185,129,0.07)",
        border: "rgba(16,185,129,0.2)",
        iconBg: "rgba(16,185,129,0.15)",
        wide: false,
    },
    {
        icon: "⚖️",
        title: "2-Strike Safety",
        desc: "Auto-block bad actors.",
        bgColor: "rgba(245,158,11,0.07)",
        border: "rgba(245,158,11,0.2)",
        iconBg: "rgba(245,158,11,0.15)",
        wide: false,
    },
    {
        icon: "📍",
        title: "Block-Based Search",
        desc: "Find items in your academic block, hostel, or library — instantly.",
        bgColor: "rgba(139,92,246,0.07)",
        border: "rgba(139,92,246,0.2)",
        iconBg: "rgba(139,92,246,0.15)",
        wide: true,
    },
];

export function FeatureGrid() {
    return (
        <section className="px-6 pb-10">
            <div className="text-center mb-6">
                <div
                    className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider mb-3"
                    style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "hsl(215 20% 55%)",
                    }}
                >
                    Why Yaaparam
                </div>
                <h2 className="text-3xl font-black text-foreground leading-tight">
                    Built for Campus Life
                </h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {FEATURES.map((f) => (
                    <div
                        key={f.title}
                        className={`rounded-3xl p-4 ${f.wide ? "col-span-2" : "col-span-1"}`}
                        style={{
                            background: f.bgColor,
                            border: `1px solid ${f.border}`,
                        }}
                    >
                        <div
                            className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl mb-3"
                            style={{ background: f.iconBg }}
                        >
                            {f.icon}
                        </div>
                        <p className="text-sm font-black text-foreground mb-1">{f.title}</p>
                        <p className="text-xs leading-relaxed" style={{ color: "hsl(215 20% 50%)" }}>
                            {f.desc}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
}
