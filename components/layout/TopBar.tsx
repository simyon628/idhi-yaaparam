"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCollege } from "@/contexts/CollegeContext";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { InlineCollegeSelection } from "@/components/ui/InlineCollegeSelection";
import { X, ChevronDown } from "lucide-react";
import SearchTrigger from "@/components/search/SearchTrigger";

export function TopBar({ hideSearch = false, lightMode = false, isProfile = false }: { hideSearch?: boolean; lightMode?: boolean; isProfile?: boolean }) {
    const { selectedCollege, isReady } = useCollege();
    const router = useRouter();
    const [unreadCount, setUnreadCount] = useState(0);
    const [showCollegeModal, setShowCollegeModal] = useState(false);
    const userId = auth?.currentUser?.uid;

    useEffect(() => {
        if (!userId || !db) return;
        const q = query(
            collection(db as any, "notifications"),
            where("userId", "==", userId),
            where("isRead", "==", false)
        );
        const unsub = onSnapshot(q, (snap) => setUnreadCount(snap.size));
        return () => unsub();
    }, [userId]);

    useEffect(() => {
        if (selectedCollege) setShowCollegeModal(false);
    }, [selectedCollege]);

    if (!isReady) return null;

    const collegeName =
        selectedCollege?.acronym ||
        (selectedCollege?.name
            ? selectedCollege.name.split(" ").map((w: string) => w[0]).join("").toUpperCase()
            : "Campus");

    const headerBg = lightMode ? "#fff" : "linear-gradient(180deg,#13131F 0%,#16162A 100%)";
    const textColor = lightMode ? "#13131F" : "#fff";
    const subtextColor = lightMode ? "rgba(19,19,31,0.5)" : "rgba(255,255,255,0.38)";
    const buttonBg = lightMode ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.08)";
    const buttonBorder = lightMode ? "1px solid rgba(0,0,0,0.06)" : "1px solid rgba(255,255,255,0.12)";

    return (
        <>
            {/* ── Top Bar ── */}
            <div
                style={{
                    background: headerBg,
                    color: textColor,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px 20px 10px",
                    fontFamily: "'DM Sans', sans-serif",
                    borderBottom: lightMode ? "1px solid rgba(0,0,0,0.04)" : "none"
                }}
            >
                {/* Logo */}
                <div
                    className="flex items-center gap-2.5 cursor-pointer"
                    onClick={() => router.push("/rentals")}
                >
                    <div
                        style={{
                            width: 38,
                            height: 38,
                            background: "linear-gradient(135deg,#5548E8,#7B72FF)",
                            borderRadius: 12,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 20,
                            boxShadow: "0 4px 16px rgba(85,72,232,0.45)",
                        }}
                    >
                        🚀
                    </div>
                    <div>
                        <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 16, color: textColor, lineHeight: 1 }}>
                            Idhi Yaaparam
                        </div>
                        <div style={{ fontSize: 10, color: subtextColor, letterSpacing: "1.8px", textTransform: "uppercase", marginTop: 2 }}>
                            Student Platform
                        </div>
                    </div>
                </div>

                {/* Right: college chip + bell */}
                <div className="flex items-center gap-2">
                    {/* Notification bell */}
                    <button
                        onClick={() => router.push("/notifications")}
                        style={{
                            width: 36,
                            height: 36,
                            background: buttonBg,
                            border: buttonBorder,
                            borderRadius: 11,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            position: "relative",
                            fontSize: 16,
                        }}
                    >
                        🔔
                        {unreadCount > 0 && (
                            <span
                                style={{
                                    position: "absolute",
                                    top: 7,
                                    right: 7,
                                    width: 7,
                                    height: 7,
                                    background: "#FF5F5F",
                                    borderRadius: "50%",
                                    border: lightMode ? "1.5px solid #fff" : "1.5px solid #16162A",
                                }}
                            />
                        )}
                    </button>

                    {/* College chip */}
                    {!isProfile && (
                        <button
                            onClick={() => setShowCollegeModal(true)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                                background: buttonBg,
                                border: buttonBorder,
                                borderRadius: 20,
                                padding: "6px 11px",
                                cursor: "pointer",
                            }}
                        >
                            <span
                                className="iy-pulse-dot"
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: "50%",
                                    background: "#00C48C",
                                    flexShrink: 0,
                                    display: "inline-block",
                                }}
                            />
                            <span style={{ fontSize: 11, color: lightMode ? "#13131F" : "rgba(255,255,255,0.72)", fontWeight: 600 }}>
                                {collegeName}
                            </span>
                            <ChevronDown style={{ width: 12, height: 12, color: lightMode ? "rgba(19,19,31,0.4)" : "rgba(255,255,255,0.4)" }} />
                        </button>
                    )}
                </div>
            </div>

            {/* ── Search Bar Row ── */}
            {!hideSearch && (
                <div className="px-5 pb-4" style={{ background: lightMode ? "#fff" : "linear-gradient(180deg,#16162A 0%,#13131F 100%)", borderBottom: lightMode ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
                    <SearchTrigger />
                </div>
            )}

            {/* College Selection Modal */}
            {showCollegeModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-5 animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl relative">
                        <div className="flex items-center justify-between p-5 border-b border-slate-100"
                            style={{ background: "linear-gradient(135deg,#5548E8,#7B72FF)" }}>
                            <h2 className="text-lg font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
                                🎓 Change College
                            </h2>
                            <button
                                onClick={() => setShowCollegeModal(false)}
                                className="p-2 -mr-2 text-white/60 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-5 max-h-[70vh] overflow-y-auto">
                            <InlineCollegeSelection />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
