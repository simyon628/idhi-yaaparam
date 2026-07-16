"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCollege } from "@/contexts/CollegeContext";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { InlineCollegeSelection } from "@/components/ui/InlineCollegeSelection";
import { X, ChevronDown, Search as SearchIcon, Camera, Mic } from "lucide-react";
import { useSearchStore } from "@/stores/searchStore";

export function TopBar({
    hideSearch = false,
    lightMode = false,
    isProfile = false,
}: {
    hideSearch?: boolean;
    lightMode?: boolean;
    isProfile?: boolean;
}) {
    const { selectedCollege, isReady } = useCollege();
    const router = useRouter();
    const [unreadCount, setUnreadCount] = useState(0);
    const [showCollegeModal, setShowCollegeModal] = useState(false);
    const userId = auth?.currentUser?.uid;

    // Search store
    const { open: openSearch, setQuery, executeSearch, query: storeQuery } = useSearchStore();
    const [searchInputVal, setSearchInputVal] = useState("");

    // Sync search input with store
    useEffect(() => {
        setSearchInputVal(storeQuery);
    }, [storeQuery]);

    // Notification count listener
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

    // Close modal when college selected
    useEffect(() => {
        if (selectedCollege) setShowCollegeModal(false);
    }, [selectedCollege]);

    if (!isReady) return null;

    const collegeName =
        selectedCollege?.acronym ||
        (selectedCollege?.name
            ? selectedCollege.name
                  .split(" ")
                  .map((w: string) => w[0])
                  .join("")
                  .toUpperCase()
            : "Campus");

    // Theme tokens
    const headerBg = "#ffffff";
    const textColor = "#111827";
    const subtextColor = "#6B7280";
    const buttonBg = "rgba(0,0,0,0.04)";
    const buttonBorder = "1px solid rgba(0,0,0,0.06)";

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchInputVal.trim()) {
            setQuery(searchInputVal);
            executeSearch(searchInputVal, router);
        }
    };

    return (
        <>
            {/* ── Brand Row ── */}
            <div
                style={{
                    background: headerBg,
                    color: textColor,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px 20px 10px",
                    fontFamily: "'DM Sans', sans-serif",
                    borderBottom: "1px solid rgba(0,0,0,0.04)",
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
                            background: "linear-gradient(135deg,#0B57D0,#1A73E8)",
                            borderRadius: 12,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 20,
                            boxShadow: "0 4px 16px rgba(11,87,208,0.45)",
                        }}
                    >
                        🚀
                    </div>
                    <div>
                        <div
                            style={{
                                fontFamily: "'Syne',sans-serif",
                                fontWeight: 800,
                                fontSize: 16,
                                color: textColor,
                                lineHeight: 1,
                            }}
                        >
                            Idhi Yaaparam
                        </div>
                        <div
                            style={{
                                fontSize: 10,
                                color: subtextColor,
                                letterSpacing: "1.8px",
                                textTransform: "uppercase",
                                marginTop: 2,
                            }}
                        >
                            Student Platform
                        </div>
                    </div>
                </div>

                {/* Right: bell + college chip */}
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
                                    border: "1.5px solid #fff",
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
                            <span style={{ fontSize: 11, color: "#111827", fontWeight: 600 }}>
                                {collegeName}
                            </span>
                            <ChevronDown style={{ width: 12, height: 12, color: "#6B7280" }} />
                        </button>
                    )}
                </div>
            </div>

            {/* ── Search Bar Row ── */}
            {!hideSearch && (
                <div
                    style={{
                        padding: "0 20px 12px",
                        background: "#ffffff",
                        borderBottom: "1px solid rgba(0,0,0,0.04)",
                    }}
                >
                    <form
                        onSubmit={handleSearchSubmit}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            background: "#F8FAFC",
                            border: "1px solid #E5E7EB",
                            borderRadius: 28,
                            height: 48,
                            width: "100%",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                            overflow: "hidden",
                            paddingRight: 6,
                        }}
                    >
                        <button
                            type="submit"
                            style={{
                                padding: "0 10px 0 16px",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                flexShrink: 0,
                            }}
                        >
                            <SearchIcon style={{ width: 19, height: 19, color: "#6B7280" }} />
                        </button>
                        <input
                            type="text"
                            value={searchInputVal}
                            placeholder="Search calculators, drafters, books..."
                            onChange={(e) => {
                                setSearchInputVal(e.target.value);
                                setQuery(e.target.value);
                            }}
                            onClick={openSearch}
                            style={{
                                flex: 1,
                                background: "transparent",
                                border: "none",
                                outline: "none",
                                fontWeight: 500,
                                fontSize: 14,
                                color: "#111827",
                                fontFamily: "'DM Sans', sans-serif",
                                minWidth: 0,
                            }}
                        />
                        <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
                            <button
                                type="button"
                                style={{ padding: 7, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}
                            >
                                <Camera style={{ width: 16, height: 16, color: "#9CA3AF" }} />
                            </button>
                            <button
                                type="button"
                                style={{ padding: 7, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}
                            >
                                <Mic style={{ width: 16, height: 16, color: "#9CA3AF" }} />
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ── College Selection Modal ── */}
            {showCollegeModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-5 animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl relative">
                        <div
                            className="flex items-center justify-between p-5 border-b border-slate-100"
                            style={{ background: "linear-gradient(135deg,#0B57D0,#1A73E8)" }}
                        >
                            <h2
                                className="text-lg font-black text-white"
                                style={{ fontFamily: "'Syne', sans-serif" }}
                            >
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
