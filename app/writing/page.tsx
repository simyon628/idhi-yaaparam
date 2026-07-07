"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { Plus, Clock, IndianRupee, Loader2, GraduationCap, X } from "lucide-react";
import { useCollege } from "@/contexts/CollegeContext";
import { WritingJob } from "@/lib/types";
import { BottomNav } from "@/components/layout/BottomNav";
import { theme } from "@/lib/theme.config";

export default function WritingFeedPage() {
    const [jobs, setJobs] = useState<WritingJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const router = useRouter();
    const { selectedCollege, isReady } = useCollege();
    const userId = auth?.currentUser?.uid;

    useEffect(() => {
        if (!selectedCollege || !db) { setLoading(false); return; }
        const fetchJobs = async () => {
            try {
                const q = query(
                    collection(db as any, "writing_jobs"),
                    where("college", "==", selectedCollege.name),
                    where("status", "==", "open"),
                    orderBy("createdAt", "desc")
                );
                const snap = await getDocs(q);
                setJobs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as WritingJob)));
            } catch (err) {
                console.error("Error fetching writing jobs:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchJobs();
    }, [selectedCollege]);

    if (isReady && !selectedCollege) {
        return (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", textAlign: "center", padding: "0 24px", background: theme.surface }}>
                <span style={{ fontSize: 52, marginBottom: 20 }}>🎓</span>
                <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 24, color: "#111827", marginBottom: 8 }}>Select a Campus</h2>
                <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 28, maxWidth: 280, lineHeight: 1.6 }}>Select your college from the home page to view writing jobs.</p>
                <button
                    onClick={() => router.push("/")}
                    style={{ background: theme.brand.primary, color: "#fff", padding: "14px 32px", borderRadius: 18, fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", boxShadow: `0 8px 28px ${theme.brand.primary}66` }}
                >Go to Home</button>
            </div>
        );
    }

    const filteredJobs = jobs.filter(job =>
        job.title.toLowerCase().includes(search.toLowerCase()) ||
        job.type.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "var(--iy-surface)", fontFamily: "'DM Sans',sans-serif", paddingBottom: 112 }}>

            {/* ── LIGHT HEADER ── */}
            <div style={{ background: theme.header.background, padding: "14px 20px 24px", position: "relative", overflow: "hidden" }}>
                {/* Top row: logo + bell */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, position: "relative", zIndex: 3 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => router.push("/rentals")}>
                        <div style={{ width: 38, height: 38, background: "linear-gradient(135deg,#00C48C,#00A876)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: "0 4px 16px rgba(0,196,140,0.45)" }}>✍️</div>
                        <div>
                            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 16, color: "#111827", lineHeight: 1 }}>Writing Work</div>
                            <div style={{ fontSize: 10, color: "#6B7280", letterSpacing: "1.8px", textTransform: "uppercase", marginTop: 2 }}>Earn Money</div>
                        </div>
                    </div>
                    <button
                        onClick={() => router.push("/notifications")}
                        style={{ width: 36, height: 36, background: "#fff", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16, position: "relative", zIndex: 3 }}
                    >🔔</button>
                </div>

                {/* Headline */}
                <div style={{ position: "relative", zIndex: 3, marginBottom: 18 }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(0,196,140,0.14)", border: "1px solid rgba(0,196,140,0.22)", borderRadius: 20, padding: "4px 11px", fontSize: 11, fontWeight: 700, color: "#00C48C", letterSpacing: ".5px", marginBottom: 10 }}>
                        ✨ EARN MONEY
                    </div>
                    <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 26, color: "#111827", lineHeight: 1.2, marginBottom: 6 }}>
                        Open <span style={{ color: "#00C48C" }}>Bounties</span>
                    </h1>
                    <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.6 }}>
                        Help peers with assignments & lab records. Get paid per job.
                    </p>
                </div>

                {/* Search */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", border: "1px solid rgba(0,0,0,0.1)", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", borderRadius: 14, padding: "10px 14px", position: "relative", zIndex: 3 }}>
                    <span style={{ fontSize: 16, color: "#9CA3AF" }}>🔍</span>
                    <input
                        type="text"
                        placeholder="Search assignments, records..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#111827", fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}
                    />
                    {search && (
                        <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                            <X style={{ width: 14, height: 14, color: "#9CA3AF" }} />
                        </button>
                    )}
                </div>
            </div>

            {/* ── JOB COUNT ── */}
            <div style={{ padding: "16px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 17, color: "var(--iy-text1)" }}>Available Jobs</div>
                <span style={{ background: "var(--iy-primary-light)", color: "var(--iy-primary)", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20 }}>
                    {jobs.length} Jobs
                </span>
            </div>

            {/* ── JOB LIST ── */}
            <div style={{ flex: 1, padding: "0 16px", display: "flex", flexDirection: "column", gap: 12 }}>
                {loading ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
                        <Loader2 style={{ width: 32, height: 32, color: "var(--iy-primary)", animation: "spin 1s linear infinite" }} />
                        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                    </div>
                ) : filteredJobs.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px 20px" }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>✍️</div>
                        <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18, color: "var(--iy-text1)", marginBottom: 8 }}>No open jobs yet</div>
                        <div style={{ fontSize: 13, color: "var(--iy-text3)", lineHeight: 1.6, marginBottom: 20 }}>Be the first to post a new assignment bounty on campus!</div>
                        <button
                            onClick={() => router.push("/writing/new")}
                            style={{ background: "linear-gradient(135deg,#00C48C,#00A876)", color: "#fff", padding: "12px 24px", borderRadius: 14, fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", boxShadow: "0 6px 20px rgba(0,196,140,0.35)" }}
                        >+ Post a Job</button>
                    </div>
                ) : (
                    filteredJobs.map(job => {
                        const isOwner = job.posterId === userId;
                        const deadlineDate = job.deadline?.toDate ? job.deadline.toDate() : new Date(job.deadline);
                        const isUrgent = deadlineDate.getTime() - new Date().getTime() < 86400000;
                        const typeColors: Record<string, { bg: string; cl: string }> = {
                            Record:     { bg: "var(--iy-emerald-light)", cl: "#007A55" },
                            Assignment: { bg: "var(--iy-amber-light)",   cl: "#B36200" },
                        };
                        const tc = typeColors[job.type] || { bg: "var(--iy-primary-light)", cl: "var(--iy-primary)" };

                        return (
                            <div
                                key={job.id}
                                onClick={() => router.push(`/writing/${job.id}`)}
                                style={{ background: "#fff", borderRadius: 20, boxShadow: "var(--iy-sh-card)", padding: "16px", cursor: "pointer", transition: "transform 0.15s" }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                                    <div style={{ flex: 1, paddingRight: 12 }}>
                                        <span style={{ display: "inline-block", fontSize: 10, textTransform: "uppercase", fontWeight: 700, letterSpacing: ".5px", padding: "2px 8px", borderRadius: 6, marginBottom: 6, background: tc.bg, color: tc.cl }}>{job.type}</span>
                                        <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 15, color: "var(--iy-text1)", lineHeight: 1.3 }}>{job.title}</h3>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 2, background: "var(--iy-emerald-light)", borderRadius: 12, padding: "8px 12px", flexShrink: 0 }}>
                                        <IndianRupee style={{ width: 13, height: 13, color: "#007A55" }} />
                                        <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 14, color: "#007A55" }}>{job.price}</span>
                                    </div>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 11, fontWeight: 600, color: "var(--iy-text3)" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 4, color: isUrgent ? "#FF5F5F" : "var(--iy-text3)" }}>
                                        <Clock style={{ width: 12, height: 12 }} />
                                        <span>{deadlineDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                                    </div>
                                    {job.department && (
                                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                            <GraduationCap style={{ width: 12, height: 12 }} />
                                            <span>{job.department}</span>
                                        </div>
                                    )}
                                </div>

                                {isOwner && (
                                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--iy-primary-light)" }}>
                                        <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "var(--iy-primary)", background: "var(--iy-primary-light)", padding: "3px 8px", borderRadius: 6 }}>Your Post</span>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* ── FAB ── */}
            <button
                onClick={() => router.push("/writing/new")}
                style={{ position: "fixed", bottom: 88, right: 20, width: 54, height: 54, background: "linear-gradient(135deg,#00C48C,#00A876)", borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 28px rgba(0,196,140,0.50)", cursor: "pointer", zIndex: 200, border: "none" }}
            >
                <Plus style={{ width: 24, height: 24, color: "#fff" }} />
            </button>

            <BottomNav />
        </div>
    );
}
