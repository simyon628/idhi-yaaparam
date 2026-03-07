"use client";

import { useState, useEffect, useRef } from "react";
import { useCollege } from "@/contexts/CollegeContext";
import { Search, MapPin, X, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { College } from "@/lib/types";
import { AutoDetectedCollege } from "@/lib/hooks/useBackgroundCollegeDetection";

interface SelectCollegeModalProps {
    isOpen: boolean;
    onClose?: () => void;
    /** Injected from background detection running on the landing page */
    detectionStatus: "idle" | "detecting" | "ready" | "failed";
    autoDetectedCollege: AutoDetectedCollege | null;
}

function formatDistance(m: number): string {
    if (m < 1000) return `about ${Math.round(m)} m away`;
    return `about ${(m / 1000).toFixed(1)} km away`;
}

export function SelectCollegeModal({
    isOpen,
    onClose,
    detectionStatus,
    autoDetectedCollege,
}: SelectCollegeModalProps) {
    const { setSelectedCollege } = useCollege();

    // Manual search state
    const [allColleges, setAllColleges] = useState<College[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isFetchingList, setIsFetchingList] = useState(false);
    const [showManual, setShowManual] = useState(false);

    // If still detecting when modal opens, wait up to 5s then fall through to manual
    const [waitExpired, setWaitExpired] = useState(false);
    const waitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Start the 5-second fallback timer when modal opens while detecting
    useEffect(() => {
        if (!isOpen) {
            setWaitExpired(false);
            if (waitTimer.current) clearTimeout(waitTimer.current);
            return;
        }

        if (detectionStatus === "detecting") {
            waitTimer.current = setTimeout(() => setWaitExpired(true), 5_000);
        }

        return () => {
            if (waitTimer.current) clearTimeout(waitTimer.current);
        };
    }, [isOpen, detectionStatus]);

    // Load full Firestore list for manual search (once)
    useEffect(() => {
        if (!isOpen || allColleges.length > 0) return;

        const fetchColleges = async () => {
            if (!db) return;
            setIsFetchingList(true);
            try {
                const q = query(collection(db, "colleges"), orderBy("name", "asc"));
                const querySnapshot = await getDocs(q);

                const fetchedColleges: College[] = [];
                querySnapshot.forEach((doc) => {
                    fetchedColleges.push({ id: doc.id, ...doc.data() } as College);
                });

                setAllColleges(fetchedColleges);
            } catch (err) {
                console.error("Failed to load colleges list from Firestore:", err);
            } finally {
                setIsFetchingList(false);
            }
        };

        fetchColleges();
    }, [isOpen, allColleges.length]);

    if (!isOpen) return null;

    const filteredColleges: College[] = searchQuery.trim() === ""
        ? []
        : allColleges
            .filter((c: College) => {
                const searchLower = searchQuery.toLowerCase().trim();
                const nameLower = c.name.toLowerCase();

                // Exact substring match
                if (nameLower.includes(searchLower)) return true;

                // Acronym match (e.g., "SRKR" for "Sagi Rama Krishnam Raju Engineering College")
                const acronym = nameLower.split(/[\s-]+/).map(word => word[0]).join('');
                if (acronym.includes(searchLower)) return true;

                return false;
            })
            .slice(0, 15);

    const closeAndReset = () => {
        setSearchQuery("");
        setShowManual(false);
        setWaitExpired(false);
        if (onClose) onClose();
    };

    const confirmAutoDetected = () => {
        if (!autoDetectedCollege) return;
        // Try to find a match in our curated local CSV for a cleaner name
        const lower = autoDetectedCollege.name.toLowerCase();
        const csvMatch = allColleges.find((col: College) => {
            const colLower = col.name.toLowerCase();
            return lower.includes(colLower) || colLower.includes(lower);
        });

        const college: College = csvMatch ?? {
            id: autoDetectedCollege.id,
            name: autoDetectedCollege.name,
            state: "",
            city: "",
            lat: autoDetectedCollege.lat,
            lng: autoDetectedCollege.lon,
        } as College;

        setSelectedCollege(college);
        closeAndReset();
    };

    const handleManualSelect = (college: College) => {
        setSelectedCollege(college);
        closeAndReset();
    };

    const openManualSearch = () => {
        setShowManual(true);
        setTimeout(() => searchInputRef.current?.focus(), 80);
    };

    // ── Derive which content section to show ─────────────────────────────────
    const isStillDetecting = detectionStatus === "detecting" && !waitExpired;
    const showConfirmation = detectionStatus === "ready" && !!autoDetectedCollege && !showManual;
    const showManualSearch = showManual || detectionStatus === "failed" || (detectionStatus === "detecting" && waitExpired) || detectionStatus === "idle";

    return (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/40 backdrop-blur-sm mx-auto w-full md:max-w-md">
            <div className="bg-white w-full flex flex-col animate-in slide-in-from-bottom-full duration-300 shadow-2xl h-full rounded-none md:h-[85vh] md:rounded-t-3xl md:border-t md:border-indigo-100">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-indigo-50 mt-8 md:mt-0 shrink-0">
                    <h2 className="text-2xl font-black text-slate-800" style={{ fontFamily: "Outfit, sans-serif" }}>
                        Select your campus
                    </h2>
                    {onClose && (
                        <button onClick={closeAndReset} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="px-5 pt-5 pb-3 flex flex-col gap-4 shrink-0">

                    {/* ── State 1: Still detecting in background ── */}
                    {isStillDetecting && (
                        <div className="flex flex-col items-center justify-center py-8 gap-3 bg-indigo-50 border border-indigo-100 rounded-2xl animate-in fade-in">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                            <p className="text-indigo-800 font-bold text-center px-4">Detecting your college…</p>
                            <p className="text-indigo-400 text-xs font-medium px-6 text-center">Just a moment</p>
                        </div>
                    )}

                    {/* ── State 2: Confirmation (single nearest detected) ── */}
                    {showConfirmation && (
                        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex flex-col gap-4 animate-in fade-in slide-in-from-top-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">We detected your college</p>
                                    <p className="text-xl font-black text-slate-800" style={{ fontFamily: "Outfit, sans-serif" }}>
                                        {autoDetectedCollege!.name}
                                    </p>
                                    <p className="text-xs text-green-600 font-semibold mt-0.5">
                                        <MapPin className="inline w-3 h-3 mr-0.5" />
                                        {formatDistance(autoDetectedCollege!.distanceM)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={confirmAutoDetected}
                                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition-all active:scale-95"
                                >
                                    ✓ Yes, this is my college
                                </button>
                                <button
                                    onClick={openManualSearch}
                                    className="w-full py-2 text-slate-500 text-sm font-bold rounded-xl hover:text-indigo-600 transition-colors"
                                >
                                    This is not my college →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── State 3: Manual search (failed / expired / user chose it) ── */}
                    {showManualSearch && (
                        <div className="flex flex-col gap-3">
                            {(detectionStatus === "failed" || waitExpired) && (
                                <div className="bg-rose-50 border border-rose-100 rounded-xl px-4 py-3 flex items-start gap-2 animate-in fade-in">
                                    <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                                    <p className="text-rose-700 text-sm font-semibold">
                                        We couldn&apos;t detect your college automatically. Please search manually.
                                    </p>
                                </div>
                            )}
                            <div>
                                {showManual && (
                                    <label className="text-slate-700 font-bold text-sm ml-1 block mb-1.5">Enter your college manually</label>
                                )}
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-300" />
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        placeholder="Search college name…"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        disabled={isFetchingList}
                                        className="w-full h-14 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 font-medium focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Scrollable manual search results */}
                <div className="flex-1 overflow-y-auto px-5 pb-10">
                    {isFetchingList ? (
                        <div className="flex justify-center mt-8">
                            <Loader2 className="w-6 h-6 animate-spin text-indigo-300" />
                        </div>
                    ) : searchQuery.trim() !== "" && filteredColleges.length === 0 ? (
                        <p className="text-center text-slate-500 mt-10 text-sm font-medium">
                            No colleges found. Try a shorter keyword.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {filteredColleges.map(college => (
                                <button
                                    key={college.id}
                                    onClick={() => handleManualSelect(college)}
                                    className="w-full text-left p-4 rounded-xl border bg-white border-slate-100 shadow-sm hover:border-indigo-400 transition-all flex items-center gap-3 active:scale-95 group"
                                >
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-indigo-50 text-indigo-600 font-black group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                        <span className="text-base">{college.name.charAt(0)}</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-700 group-hover:text-indigo-900 transition-colors">{college.name}</p>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                            <span>{college.city || "India"}</span>
                                            {college.state && (
                                                <>
                                                    <span className="w-1 h-1 rounded-full bg-slate-200" />
                                                    <span>{college.state}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
