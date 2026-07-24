"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useCollege } from "@/contexts/CollegeContext";
import { Search, MapPin, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { College } from "@/lib/types";
import { useBackgroundCollegeDetection, AutoDetectedCollege } from "@/lib/hooks/useBackgroundCollegeDetection";
import topColleges from "@/lib/top_colleges.json";

function formatDistance(m: number): string {
    if (m < 1000) return `about ${Math.round(m)} m away`;
    return `about ${(m / 1000).toFixed(1)} km away`;
}

export function InlineCollegeSelection() {
    const { setSelectedCollege } = useCollege();
    const { status: detectionStatus, decision, startDetection } = useBackgroundCollegeDetection();

    useEffect(() => {
        startDetection();
    }, []);

    // Search state
    const [searchQuery, setSearchQuery] = useState("");
    const [displayedColleges, setDisplayedColleges] = useState<College[]>(topColleges as unknown as College[]);
    const [isLoading, setIsLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [showManual, setShowManual] = useState(false);

    const [waitExpired, setWaitExpired] = useState(false);
    const waitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const listContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (detectionStatus === "detecting") {
            waitTimer.current = setTimeout(() => setWaitExpired(true), 9_000);
        }
        return () => {
            if (waitTimer.current) clearTimeout(waitTimer.current);
        };
    }, [detectionStatus]);

    // Fast API search fetcher
    const fetchSearchResults = useCallback(async (queryStr: string, pageNum: number, append: boolean = false) => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/colleges/search?q=${encodeURIComponent(queryStr)}&page=${pageNum}&limit=50`);
            if (res.ok) {
                const data = await res.json();
                if (append) {
                    setDisplayedColleges(prev => [...prev, ...data.items]);
                } else {
                    setDisplayedColleges(data.items);
                }
                setHasMore(data.hasMore);
            }
        } catch (err) {
            console.error("Failed to search colleges:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Instant search trigger on typing even 1 character
    useEffect(() => {
        setPage(1);
        const timer = setTimeout(() => {
            fetchSearchResults(searchQuery, 1, false);
        }, searchQuery ? 120 : 0);

        return () => clearTimeout(timer);
    }, [searchQuery, fetchSearchResults]);

    // Infinite scroll observer
    const handleScroll = useCallback(() => {
        if (!listContainerRef.current || isLoading || !hasMore) return;

        const { scrollTop, scrollHeight, clientHeight } = listContainerRef.current;
        if (scrollTop + clientHeight >= scrollHeight - 150) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchSearchResults(searchQuery, nextPage, true);
        }
    }, [isLoading, hasMore, page, searchQuery, fetchSearchResults]);

    const confirmAutoDetected = (detectedItem: AutoDetectedCollege) => {
        if (!detectedItem) return;
        const lower = detectedItem.name.toLowerCase();
        const match = (topColleges as unknown as College[]).find((col) => {
            const colLower = col.name.toLowerCase();
            return lower.includes(colLower) || colLower.includes(lower);
        });

        const college: College = match ?? {
            id: detectedItem.id,
            name: detectedItem.name,
            state: "",
            city: "",
            lat: detectedItem.lat,
            lng: detectedItem.lon,
        } as College;

        setSelectedCollege(college);
    };

    const handleManualSelect = (college: College) => {
        setSelectedCollege(college);
    };

    const openManualSearch = () => {
        setShowManual(true);
        setTimeout(() => searchInputRef.current?.focus(), 80);
    };

    const isStillDetecting = detectionStatus === "detecting" && !waitExpired;
    const isReady = detectionStatus === "ready" && !!decision && !showManual;

    const showSingleConfirmation = isReady && decision?.mode === "single";
    const showMultipleConfirmation = isReady && decision?.mode === "multiple";
    const showManualSearchUI = showManual || detectionStatus === "failed" || (detectionStatus === "detecting" && waitExpired) || detectionStatus === "idle" || (isReady && decision?.mode === "none");

    return (
        <div className="w-full text-left animate-in fade-in slide-in-from-top-4 duration-500">
            {/* State 1: Still detecting */}
            {isStillDetecting && (
                <div className="flex flex-col items-center justify-center py-6 gap-3 bg-blue-50 border border-blue-100 rounded-2xl">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <p className="text-blue-800 font-bold text-center px-4">Detecting your college…</p>
                </div>
            )}

            {/* State 2: Single Confirmation */}
            {showSingleConfirmation && decision?.mode === "single" && (
                <div className="bg-white border-2 border-blue-100 rounded-3xl p-5 flex flex-col gap-4 shadow-xl shadow-blue-500/10 relative overflow-hidden">
                    <div className="flex flex-col gap-3 relative z-10">
                        <div className="flex items-start gap-3">
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0 border border-blue-100 shadow-inner">
                                <CheckCircle2 className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-800 leading-tight mb-2">
                                    We found a college near you:<br />
                                    <span className="text-blue-600 font-black">{decision.college.name}</span> <br />
                                    <span className="text-xs text-slate-500">{formatDistance(decision.college.distanceM)}</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 mt-2">
                            <button
                                onClick={() => confirmAutoDetected(decision.college)}
                                className="w-full py-4 gradient-blue text-white font-black text-base rounded-2xl shadow-blue transition-all active:scale-95"
                            >
                                Confirm this is my college
                            </button>
                            <button
                                onClick={openManualSearch}
                                className="w-full py-2.5 text-slate-400 text-xs font-black uppercase tracking-widest rounded-xl hover:text-slate-600 hover:bg-slate-50 transition-all"
                            >
                                Choose a different college
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* State 3: Multiple Confirmation */}
            {showMultipleConfirmation && decision?.mode === "multiple" && (
                <div className="bg-white border-2 border-blue-100 rounded-3xl p-5 flex flex-col gap-4 shadow-xl shadow-blue-500/10 relative overflow-hidden">
                    <div className="flex flex-col gap-3 relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <MapPin className="w-5 h-5 text-blue-600" />
                            <h3 className="font-bold text-slate-800">Colleges near you</h3>
                        </div>

                        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                            {decision.colleges.map((col) => (
                                <button
                                    key={col.id}
                                    onClick={() => confirmAutoDetected(col)}
                                    className="text-left w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50/50 transition-all group flex flex-col gap-1 active:scale-95"
                                >
                                    <span className="font-bold text-slate-800 group-hover:text-blue-700 leading-snug">{col.name}</span>
                                    <span className="text-xs font-semibold text-slate-500">{formatDistance(col.distanceM)}</span>
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={openManualSearch}
                            className="w-full mt-2 py-2.5 text-slate-400 text-xs font-black uppercase tracking-widest rounded-xl hover:text-slate-600 hover:bg-slate-50 transition-all"
                        >
                            Or search manually
                        </button>
                    </div>
                </div>
            )}

            {/* State 4: Manual search UI */}
            {showManualSearchUI && (
                <div className="flex flex-col gap-3 bg-white border-2 border-slate-100 rounded-3xl p-5 shadow-xl shadow-slate-200/20">
                    {(detectionStatus === "failed" || waitExpired) && !showManual && (
                        <div className="bg-rose-50 border border-rose-100 rounded-xl px-4 py-3 flex items-start gap-2 mb-2">
                            <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                            <p className="text-rose-700 text-xs font-bold leading-relaxed">
                                We couldn't detect your college automatically. Please search manually.
                            </p>
                        </div>
                    )}
                    <div>
                        <label className="text-slate-700 font-black text-sm ml-1 block mb-2 uppercase tracking-wider">Search College</label>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="e.g. SRKR, SRM, IIT, or campus name…"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full h-14 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 font-bold focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none shadow-inner"
                            />
                        </div>
                    </div>

                    {/* Inline Search Results with Infinite Scroll */}
                    <div
                        ref={listContainerRef}
                        onScroll={handleScroll}
                        className="space-y-2 mt-2 max-h-72 overflow-y-auto no-scrollbar"
                    >
                        {displayedColleges.length === 0 && !isLoading ? (
                            <p className="text-center text-slate-400 py-4 text-xs font-bold">
                                No colleges found matching &quot;{searchQuery}&quot;.
                            </p>
                        ) : (
                            <>
                                {displayedColleges.map((college) => (
                                    <button
                                        key={college.id}
                                        onClick={() => handleManualSelect(college)}
                                        className="w-full text-left p-3 rounded-xl border bg-white border-slate-100 shadow-sm hover:border-blue-500 transition-all flex items-center gap-3 active:scale-[0.98] group"
                                    >
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-blue-50 text-blue-600 font-black group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            <span className="text-base">{college.acronym ? college.acronym.slice(0, 3) : college.name.charAt(0)}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-slate-700 text-sm group-hover:text-blue-900 transition-colors truncate">
                                                    {college.name}
                                                </p>
                                                {college.acronym && (
                                                    <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-black rounded shrink-0">
                                                        {college.acronym}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 truncate">
                                                <span>{college.city || "Campus"}</span>
                                                {college.state && (
                                                    <>
                                                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                        <span>{college.state}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                                {isLoading && (
                                    <div className="flex justify-center py-3">
                                        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
