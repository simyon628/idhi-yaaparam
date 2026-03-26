"use client";

import { useCollege } from "@/contexts/CollegeContext";
import { CategoryGrid } from "@/components/ui/CategoryGrid";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Plus, X, Search as SearchIcon } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useListingMode } from "@/lib/hooks/useListingMode";
import { useSuggestions, useCategoryCounts } from "@/lib/hooks/useSearch";
import { useSearchHistory } from "@/lib/hooks/useSearchHistory";
import { SearchDropdown } from "@/components/search/SearchDropdown";
import { useRecentItems } from "@/lib/hooks/useRecentItems";
import { prefetchRentals } from "@/lib/cache/itemsCache";

export default function RentalsMarketplace() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { selectedCollege, isReady } = useCollege();
    const { listingMode: contextMode, setListingMode } = useListingMode();
    const [showDropdown, setShowDropdown] = useState(false);
    
    // We remove the redirect to "/" so the user can see the shell without a college

    const urlType = searchParams.get("type") as "rent" | "buy" | "sell" | null;
    const activeMode = urlType || contextMode || "rent";

    const { query, setQuery, suggestions, clearSuggestions } = useSuggestions(selectedCollege?.id, activeMode, true);
    const { recentSearches, removeSearch } = useSearchHistory();
    const { recentItems } = useRecentItems(selectedCollege?.id, activeMode);
    const trendingSearches = ["Calculator", "Lab Coat", "Drafter", "Casio fx991", "Arduino"];
    const { counts, loading: countsLoading } = useCategoryCounts(selectedCollege?.id, activeMode, true);

    const handleModeChange = (m: "rent" | "buy" | "sell") => {
        setListingMode(m);
        const params = new URLSearchParams(searchParams);
        params.set("type", m);
        router.replace(`/rentals?${params.toString()}`, { scroll: false });
    };

    // Warm cache immediately when home loads
    useEffect(() => {
        if (db && selectedCollege?.id) {
            prefetchRentals(db as any, selectedCollege.id);
        }
    }, [selectedCollege?.id]);

    if (!isReady) return null;

    const handleFabClick = () => {
        if (!auth?.currentUser) {
            router.push("/login?redirect=/rentals/new");
        } else {
            router.push(`/rentals/new?type=${activeMode}`);
        }
    };

    const handleSearchSubmit = (q: string) => {
        if (!q.trim()) return;
        setShowDropdown(false);
        clearSuggestions();
        router.push(`/search?q=${encodeURIComponent(q.trim())}`);
    };

    /* ── Tab config ── */
    const TABS = [
        { id: "rent",  label: "🎒 Rentals",   activeGrad: "linear-gradient(135deg,#5548E8,#7B72FF)", shadow: "0 4px 16px rgba(85,72,232,0.45)" },
        { id: "buy",   label: "✍️ Writing",    activeGrad: "linear-gradient(135deg,#4CAF50 0%,#00B87D 100%)", shadow: "0 4px 16px rgba(0,196,140,0.40)" },
        { id: "sell",  label: "🏷️ Buy & Sell", activeGrad: "linear-gradient(135deg,#FF9500,#FF7A00)",  shadow: "0 4px 16px rgba(255,149,0,0.40)" },
    ] as const;

    return (
        <div
            className="flex flex-col min-h-screen pb-28"
            style={{ background: "var(--iy-surface)", fontFamily: "'DM Sans', sans-serif" }}
        >
            {/* ── HEADER (dark) ── */}
            <div
                style={{
                    background: "var(--iy-ink)",
                    padding: "16px 20px 24px",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {/* Ambient glows */}
                <div style={{ position: "absolute", top: -30, right: -20, width: 160, height: 160, background: "radial-gradient(circle,rgba(91,79,232,0.30) 0%,transparent 70%)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", bottom: 10, left: -10, width: 120, height: 120, background: "radial-gradient(circle,rgba(0,196,140,0.15) 0%,transparent 70%)", pointerEvents: "none" }} />

                {/* Top row: logo + bell + college chip */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, position: "relative", zIndex: 3 }}>
                    <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => router.push("/rentals")}>
                        <div style={{ width: 38, height: 38, background: "linear-gradient(135deg,#5548E8,#7B72FF)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: "0 4px 16px rgba(85,72,232,0.45)" }}>🚀</div>
                        <div>
                            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16, color: "#fff", lineHeight: 1 }}>Idhi Yaaparam</div>
                            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.38)", letterSpacing: "1.8px", textTransform: "uppercase", marginTop: 2 }}>Student Platform</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => router.push("/notifications")}
                            style={{ width: 36, height: 36, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16 }}
                        >🔔</button>
                        <button
                            onClick={() => router.push("/rentals?changeCollege=1")}
                            style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, padding: "6px 11px", cursor: "pointer" }}
                        >
                            <span className="iy-pulse-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: "#00C48C", flexShrink: 0, display: "inline-block" }} />
                            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.72)", fontWeight: 600 }}>
                                {selectedCollege?.acronym || selectedCollege?.name?.split(" ").map((w: string) => w[0]).join("").toUpperCase() || "Campus"}
                            </span>
                            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>↓</span>
                        </button>
                    </div>
                </div>

                {/* Search Bar ABOVE the tabs */}
                <div style={{ position: "relative", zIndex: 3, marginBottom: 18 }}>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            background: "rgba(255,255,255,0.10)",
                            border: "1px solid rgba(255,255,255,0.14)",
                            backdropFilter: "blur(10px)",
                            borderRadius: 16,
                            padding: "12px 14px",
                        }}
                    >
                        <SearchIcon style={{ width: 18, height: 18, color: "rgba(255,255,255,0.4)", flexShrink: 0 }} />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                if (e.target.value.length >= 2 || recentSearches.length > 0) setShowDropdown(true);
                                else setShowDropdown(false);
                            }}
                            onFocus={() => { if (query.length >= 2 || recentSearches.length > 0) setShowDropdown(true); }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && query.trim()) handleSearchSubmit(query);
                                if (e.key === "Escape") { setShowDropdown(false); clearSuggestions(); }
                            }}
                            placeholder="Search calculators, lab coats, drafters..."
                            style={{ flex: 1, border: "none", outline: "none", fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: "#fff", background: "transparent" }}
                            autoComplete="off"
                        />
                        <div style={{ display: "flex", gap: 6 }}>
                            {query ? (
                                <button onClick={() => { clearSuggestions(); setShowDropdown(false); }} style={{ background: "none", border: "none", cursor: "pointer" }}>
                                    <X style={{ width: 16, height: 16, color: "rgba(255,255,255,0.5)" }} />
                                </button>
                            ) : (
                                <div style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, cursor: "pointer", color: "rgba(255,255,255,0.5)" }}>⊞</div>
                            )}
                        </div>
                    </div>

                    {/* Search dropdown positioned absolutely here */}
                    {showDropdown && (
                        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, marginTop: 8 }}>
                            <SearchDropdown
                                suggestions={suggestions}
                                recentSearches={recentSearches}
                                trendingSearches={trendingSearches}
                                collegeName={selectedCollege?.name || "Campus"}
                                query={query}
                                visible={showDropdown}
                                onSelect={handleSearchSubmit}
                                onRemoveRecent={removeSearch}
                                onClose={() => setShowDropdown(false)}
                            />
                        </div>
                    )}
                </div>

                {/* Service switcher tabs */}
                <div style={{ display: "flex", gap: 7, position: "relative", zIndex: 3, paddingBottom: 24 }}>
                    {TABS.map((tab) => {
                        const isOn = activeMode === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => handleModeChange(tab.id as "rent" | "buy" | "sell")}
                                style={{
                                    flex: 1,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 5,
                                    padding: "9px 6px",
                                    borderRadius: 12,
                                    fontSize: 11.5,
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                    border: "1px solid transparent",
                                    fontFamily: "'DM Sans', sans-serif",
                                    ...(isOn
                                        ? { background: tab.activeGrad, color: "#fff", boxShadow: tab.shadow }
                                        : { background: "rgba(255,255,255,0.07)", borderColor: "rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.50)" }
                                    ),
                                }}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>


            </div>


            {/* ── MAIN CONTENT ── */}
            <div style={{ flex: 1, padding: "16px", display: "flex", flexDirection: "column", gap: 24 }}>

                {/* Rentals tab content */}
                {activeMode === "rent" && (
                    <div className="iy-fu1" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                        {/* Categories */}
                        <div>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 17, color: "var(--iy-text1)" }}>Browse Categories</div>
                                <button onClick={() => router.push("/search")} style={{ fontSize: 12, fontWeight: 700, color: "var(--iy-primary)", background: "none", border: "none", cursor: "pointer" }}>
                                    View all →
                                </button>
                            </div>
                            <CategoryGrid counts={counts} loading={countsLoading} />
                        </div>

                        {/* Recent Listings Horizontal Scroll */}
                        {recentItems.length > 0 && (
                            <div>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                                    <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 17, color: "var(--iy-text1)" }}>Recent Listings</div>
                                    <button onClick={() => router.push("/search")} style={{ fontSize: 12, fontWeight: 700, color: "var(--iy-primary)", background: "none", border: "none", cursor: "pointer" }}>
                                        See all →
                                    </button>
                                </div>
                                <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
                                    {recentItems.map(item => (
                                        <div
                                            key={item.id}
                                            onClick={() => router.push(`/rentals/${item.id}`)}
                                            style={{
                                                flex: "0 0 150px",
                                                background: "#fff",
                                                borderRadius: 22,
                                                boxShadow: "var(--iy-sh-card)",
                                                overflow: "hidden",
                                                cursor: "pointer"
                                            }}
                                        >
                                            <div style={{ height: 90, background: "linear-gradient(135deg,#EAE8FF 0%,#D5D0FF 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, position: "relative" }}>
                                                {item.itemName.toLowerCase().includes("calc") ? "🖩" : item.itemName.toLowerCase().includes("draft") ? "📐" : item.itemName.toLowerCase().includes("coat") ? "🥼" : "📦"}
                                                <div style={{ position: "absolute", top: 8, left: 8, fontSize: 9, fontWeight: 700, padding: "3px 7px", borderRadius: 20, letterSpacing: 0.4, background: "var(--iy-primary)", color: "#fff" }}>RENT</div>
                                            </div>
                                            <div style={{ padding: "10px 12px 12px" }}>
                                                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, color: "var(--iy-text1)", marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.itemName}</div>
                                                <div style={{ fontSize: 11, color: "var(--iy-text3)", marginBottom: 8, display: "flex", alignItems: "center", gap: 3 }}>
                                                    👤 {selectedCollege?.acronym || "Campus"} St.
                                                </div>
                                                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, color: "var(--iy-primary)" }}>
                                                    ₹{item.pricePerHour} <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 400, color: "var(--iy-text3)" }}>/hr</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Social Proof row */}
                        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", borderRadius: 16, padding: "14px 16px", boxShadow: "var(--iy-sh-card)" }}>
                            <div style={{ display: "flex" }}>
                                {[{ l: "S", bg: "linear-gradient(135deg,#5548E8,#7B72FF)" }, { l: "R", bg: "linear-gradient(135deg,#00C48C,#00A876)" }, { l: "A", bg: "linear-gradient(135deg,#FF9500,#FF7A00)" }, { l: "K", bg: "linear-gradient(135deg,#FF6B6B,#FF4444)" }].map(av => (
                                    <div key={av.l} style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", marginRight: -8, fontFamily: "'Syne',sans-serif", background: av.bg }}>{av.l}</div>
                                ))}
                            </div>
                            <div style={{ marginLeft: 16, flex: 1 }}>
                                <strong style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, color: "var(--iy-text1)", display: "block" }}>320 students active</strong>
                                <small style={{ fontSize: 11, color: "var(--iy-text3)" }}>Saving money on {selectedCollege?.acronym || "your"} campus</small>
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#FF9500", fontFamily: "'Syne',sans-serif", display: "flex", alignItems: "center", gap: 3 }}>⭐ 4.8</div>
                        </div>

                        {/* How It Works */}
                        <div>
                            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 17, color: "var(--iy-text1)", marginBottom: 12 }}>How It Works</div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                                {[
                                    { n: "1", ic: "🔍", lb: "Find what you need" },
                                    { n: "2", ic: "💬", lb: "Message owner" },
                                    { n: "3", ic: "✅", lb: "Pick up & return" }
                                ].map(s => (
                                    <div key={s.n} style={{ background: "#fff", borderRadius: 16, padding: "16px 10px", textAlign: "center", boxShadow: "var(--iy-sh-card)" }}>
                                        <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--iy-primary-light)", color: "var(--iy-primary)", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>{s.n}</div>
                                        <div style={{ fontSize: 20, marginBottom: 6 }}>{s.ic}</div>
                                        <div style={{ fontSize: 10, fontWeight: 600, color: "var(--iy-text2)", lineHeight: 1.3 }}>{s.lb}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Campus For You */}
                        {selectedCollege && (
                            <div>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                                    <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 17, color: "var(--iy-text1)" }}>Campus Stats</div>
                                </div>
                                <div style={{ background: "#13131F", color: "#fff", padding: "20px", borderRadius: 24, position: "relative", overflow: "hidden" }}>
                                    <div style={{ position: "absolute", top: -40, right: -20, width: 150, height: 150, background: "radial-gradient(circle,rgba(85,72,232,0.3) 0%,transparent 70%)" }} />
                                    <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 18, color: "#fff", marginBottom: 4, position: "relative", zIndex: 1 }}>🎓 {selectedCollege.name}</h3>
                                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 16, position: "relative", zIndex: 1 }}>Active student marketplace</p>

                                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", position: "relative", zIndex: 1 }}>
                                        <div style={{ background: "var(--iy-primary-light)", color: "var(--iy-primary)", fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 20 }}>📊 Analytics Mode Active</div>
                                        <div style={{ background: "var(--iy-emerald-light)", color: "#007A55", fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 20 }}>⚡ Live Rentals Supported</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Writing tab content */}
                {activeMode === "buy" && (
                    <WritingSection router={router} />
                )}

                {/* Buy & Sell tab content */}
                {activeMode === "sell" && (
                    <BuySellSection router={router} />
                )}
            </div>

            {/* ── FAB ── */}
            {activeMode !== "buy" && (
                <button
                    onClick={handleFabClick}
                    style={{
                        position: "fixed",
                        bottom: 88,
                        right: 20,
                        width: 54,
                        height: 54,
                        background: activeMode === "sell"
                            ? "linear-gradient(135deg,#FF9500,#FF7300)"
                            : "linear-gradient(135deg,#5548E8,#7B72FF)",
                        borderRadius: 18,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 26,
                        color: "#fff",
                        boxShadow: activeMode === "sell"
                            ? "0 8px 28px rgba(255,149,0,.5)"
                            : "0 8px 28px rgba(85,72,232,.5)",
                        cursor: "pointer",
                        zIndex: 200,
                        border: "none",
                    }}
                >
                    +
                </button>
            )}

            <BottomNav />
        </div>
    );
}

/* ── Writing Section ── */
function WritingSection({ router }: { router: any }) {
    return (
        <div className="iy-fu1 flex flex-col gap-5">
            {/* Earn card */}
            <div
                style={{
                    background: "#13131F",
                    borderRadius: 28,
                    padding: "22px 20px",
                    position: "relative",
                    overflow: "hidden",
                    cursor: "pointer",
                }}
                onClick={() => router.push("/writing")}
            >
                <div style={{ position: "absolute", top: -40, right: -20, width: 160, height: 160, background: "radial-gradient(circle,rgba(0,196,140,.28) 0%,transparent 70%)" }} />
                <div style={{ position: "absolute", bottom: -30, left: -10, width: 130, height: 130, background: "radial-gradient(circle,rgba(85,72,232,.22) 0%,transparent 70%)" }} />
                <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(0,196,140,.14)", border: "1px solid rgba(0,196,140,.22)", borderRadius: 20, padding: "4px 11px", fontSize: 11, fontWeight: 700, color: "#00C48C", letterSpacing: ".5px", marginBottom: 12, position: "relative", zIndex: 1 }}>
                    ✨ EARN MONEY
                </div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 22, color: "#fff", lineHeight: 1.2, marginBottom: 8, position: "relative", zIndex: 1 }}>
                    Write & <span style={{ color: "#00C48C" }}>Earn</span><br/>on Free Time
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,.48)", lineHeight: 1.55, marginBottom: 18, position: "relative", zIndex: 1 }}>
                    Lab records, assignments, project reports. Get paid per completed job. Work anytime — holidays, free periods, weekends. No fixed schedule.
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18, position: "relative", zIndex: 1 }}>
                    {["📋 Lab Records", "📝 Assignments", "📊 Reports"].map((t) => (
                        <span key={t} style={{ background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 20, padding: "5px 12px", fontSize: 11, color: "rgba(255,255,255,.6)", fontWeight: 500 }}>{t}</span>
                    ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
                    <div>
                        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 700, color: "#00C48C" }}>₹200–500 <span style={{ fontSize: 12, fontWeight: 400, color: "rgba(255,255,255,.4)", fontFamily: "'DM Sans',sans-serif" }}>/job</span></div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,.3)", marginTop: 3 }}>⭐⭐⭐⭐⭐ 4.9 · 180 active writers</div>
                    </div>
                </div>
                <button
                    style={{ background: "linear-gradient(135deg,#00C48C,#00A876)", color: "#fff", fontSize: 13, fontWeight: 700, padding: "11px 20px", borderRadius: 12, border: "none", cursor: "pointer", boxShadow: "0 6px 22px rgba(0,196,140,.38)", width: "100%", marginTop: 16 }}
                    onClick={(e) => { e.stopPropagation(); router.push("/writing"); }}
                >
                    Start Earning →
                </button>
            </div>
            
            {/* Social Proof for Writing */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", borderRadius: 16, padding: "14px 16px", boxShadow: "var(--iy-sh-card)" }}>
                <div style={{ display: "flex" }}>
                    {[{ l: "S", bg: "linear-gradient(135deg,#5548E8,#7B72FF)" }, { l: "R", bg: "linear-gradient(135deg,#00C48C,#00A876)" }, { l: "A", bg: "linear-gradient(135deg,#FF9500,#FF7A00)" }, { l: "K", bg: "linear-gradient(135deg,#FF6B6B,#FF4444)" }].map(av => (
                        <div key={av.l} style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", marginRight: -8, fontFamily: "'Syne',sans-serif", background: av.bg }}>{av.l}</div>
                    ))}
                </div>
                <div style={{ marginLeft: 16, flex: 1 }}>
                    <strong style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, color: "var(--iy-text1)", display: "block" }}>320 writers earning this week</strong>
                    <small style={{ fontSize: 11, color: "var(--iy-text3)" }}>Average ₹380/job · Work on free time</small>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#FF9500", fontFamily: "'Syne',sans-serif", display: "flex", alignItems: "center", gap: 3 }}>⭐ 4.9</div>
            </div>
        </div>
    );
}

/* ── Buy & Sell Section ── */
function BuySellSection({ router }: { router: any }) {
    // Removed the internal mode tabs, just showing a consolidated view
    return (
        <div className="iy-fu1 flex flex-col gap-4">
            
            {/* Browse categories for buy/sell */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 17, color: "var(--iy-text1)" }}>Browse Items</div>
                <button onClick={() => router.push("/search")} style={{ fontSize: 12, fontWeight: 700, color: "var(--iy-primary)", background: "none", border: "none", cursor: "pointer" }}>
                    View all →
                </button>
            </div>
            
            <CategoryGrid counts={{}} loading={false} />

            {/* Empty/placeholder state — sell */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 17, color: "var(--iy-text1)", marginBottom: 4 }}>Your Listings</div>
                <div style={{ background: "#fff", borderRadius: 24, boxShadow: "var(--iy-sh-card)", padding: "32px 20px", textAlign: "center" as const }}>
                    <div style={{ fontSize: 42, marginBottom: 12 }}>📦</div>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16, color: "var(--iy-text1)", marginBottom: 6 }}>No Listings Yet</div>
                    <div style={{ fontSize: 12, color: "var(--iy-text3)", lineHeight: 1.5, marginBottom: 16 }}>
                        List your used items and earn money from fellow students on campus.
                    </div>
                    <button
                        onClick={() => router.push("/rentals/new?type=sell")}
                        style={{ background: "linear-gradient(135deg,#FF9500,#FF7300)", color: "#fff", fontSize: 13, fontWeight: 700, padding: "12px 28px", borderRadius: 18, border: "none", cursor: "pointer", boxShadow: "0 6px 20px rgba(255,149,0,.35)" }}
                    >
                        + List Item to Sell
                    </button>
                </div>
            </div>

            {/* How to sell */}
            <div style={{ marginTop: 12 }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 17, color: "var(--iy-text1)", marginBottom: 12 }}>How to Sell</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    {[
                        { n: "1", ic: "📷", lb: "Click a photo" },
                        { n: "2", ic: "💰", lb: "Set your price" },
                        { n: "3", ic: "🤝", lb: "Meet & collect cash" }
                    ].map(s => (
                        <div key={s.n} style={{ background: "#fff", borderRadius: 16, padding: "16px 10px", textAlign: "center", boxShadow: "var(--iy-sh-card)" }}>
                            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--iy-primary-light)", color: "var(--iy-primary)", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>{s.n}</div>
                            <div style={{ fontSize: 20, marginBottom: 6 }}>{s.ic}</div>
                            <div style={{ fontSize: 10, fontWeight: 600, color: "var(--iy-text2)", lineHeight: 1.3 }}>{s.lb}</div>
                        </div>
                    ))}
                </div>
            </div>
            
        </div>
    );
}
