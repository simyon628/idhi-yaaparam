"use client";

import { useState, useEffect, useRef } from "react";
import { useCollege } from "@/contexts/CollegeContext";
import { Search, MapPin, X, Navigation, Loader2, AlertCircle } from "lucide-react";
import { getLocalColleges } from "@/lib/utils/colleges";
import { College } from "@/lib/types";
import { useDetectCollegeByLocation, NearbyCandidate } from "@/lib/hooks/useDetectCollegeByLocation";

interface SelectCollegeModalProps {
    isOpen: boolean;
    onClose?: () => void;
}

// Format metres as a human-readable string e.g. "120 m" or "1.4 km"
function formatDistance(m: number): string {
    if (m < 1000) return `${Math.round(m)} m away`;
    return `${(m / 1000).toFixed(1)} km away`;
}

export function SelectCollegeModal({ isOpen, onClose }: SelectCollegeModalProps) {
    const { setSelectedCollege } = useCollege();
    const { detectLocation, isLocating, isTakingLong, candidates, error, reset } = useDetectCollegeByLocation();

    // Manual search state
    const [allColleges, setAllColleges] = useState<College[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isFetchingList, setIsFetchingList] = useState(false);
    const [showManual, setShowManual] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Load the local CSV list once when the modal opens
    useEffect(() => {
        if (!isOpen) return;
        if (allColleges.length > 0) return;
        setIsFetchingList(true);
        getLocalColleges()
            .then(list => setAllColleges(list))
            .catch(err => console.error("Failed to load colleges list", err))
            .finally(() => setIsFetchingList(false));
    }, [isOpen, allColleges.length]);

    // Auto-open manual search if user clicked "None of these / Enter manually"
    const openManual = () => {
        setShowManual(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
    };

    const closeAndReset = () => {
        reset();
        setSearchQuery("");
        setShowManual(false);
        if (onClose) onClose();
    };

    // When user taps a candidate from Overpass list
    const handleCandidateSelect = (c: NearbyCandidate) => {
        // Try to find a match in our curated local CSV for a cleaner name
        const lower = c.name.toLowerCase();
        const csvMatch = allColleges.find(col => {
            const colLower = col.name.toLowerCase();
            return lower.includes(colLower) || colLower.includes(lower);
        });

        const college: College = csvMatch ?? {
            id: c.id,
            name: c.name,
            state: "",
            city: "",
            lat: c.lat,
            lng: c.lon,
        } as College;

        setSelectedCollege(college);
        closeAndReset();
    };

    // When user picks from manual search list
    const handleManualSelect = (college: College) => {
        setSelectedCollege(college);
        closeAndReset();
    };

    if (!isOpen) return null;

    const filteredColleges = searchQuery.trim() === ""
        ? []
        : allColleges
            .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase().trim()))
            .slice(0, 15);

    // Are we in a state where Overpass returned results?
    const showCandidates = !isLocating && candidates.length > 0 && !showManual;
    // Are we in the zero-state (nothing happened yet)?
    const showZeroState = !isLocating && candidates.length === 0 && !error && !showManual;
    // Are we showing the error state (after detection failed)?
    const showError = !isLocating && !!error && !showManual;
    // Manual search is shown when: user explicitly clicked "Enter manually", or after an error
    const isManualVisible = showManual || showError;

    return (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/40 backdrop-blur-sm mx-auto w-full md:max-w-md">
            <div className="bg-white w-full flex flex-col animate-in slide-in-from-bottom-full duration-300 shadow-2xl h-full rounded-none md:h-[85vh] md:rounded-t-3xl md:border-t md:border-indigo-100">

                {/* ── Header ── */}
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

                {/* ── Top section (detection UI) ── */}
                <div className="px-5 pt-5 pb-3 flex flex-col gap-3 shrink-0">

                    {/* 1. Detecting spinner */}
                    {isLocating && (
                        <div className="flex flex-col items-center justify-center py-8 gap-3 bg-indigo-50 border border-indigo-100 rounded-2xl animate-in fade-in">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                            <p className="text-indigo-800 font-bold text-center px-4">Looking for colleges near you…</p>
                            {isTakingLong && (
                                <p className="text-indigo-500 text-xs font-medium px-6 text-center">This is taking a moment — please wait…</p>
                            )}
                        </div>
                    )}

                    {/* 2. Overpass candidate list */}
                    {showCandidates && (
                        <div className="flex flex-col gap-2 animate-in fade-in">
                            <div className="flex items-center gap-2 px-1">
                                <MapPin className="w-4 h-4 text-indigo-500 shrink-0" />
                                <p className="text-sm font-bold text-slate-600">
                                    Detected colleges near you
                                </p>
                            </div>
                            {candidates.map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => handleCandidateSelect(c)}
                                    className="w-full text-left px-4 py-3.5 rounded-2xl bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 hover:border-indigo-400 transition-all flex items-center gap-3 active:scale-95 group"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-white border border-indigo-100 group-hover:bg-indigo-600 transition-colors flex items-center justify-center shrink-0">
                                        <MapPin className="w-5 h-5 text-indigo-500 group-hover:text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-slate-800 group-hover:text-indigo-900 truncate">{c.name}</p>
                                        <p className="text-xs text-indigo-500 font-semibold mt-0.5">{formatDistance(c.distanceM)}</p>
                                    </div>
                                </button>
                            ))}
                            <button
                                onClick={openManual}
                                className="text-slate-400 text-xs font-bold text-center py-2 hover:text-indigo-500 transition-colors"
                            >
                                None of these? Enter college manually ↓
                            </button>
                        </div>
                    )}

                    {/* 3. Error banner (location denied / timed out / no results) */}
                    {showError && (
                        <div className="bg-rose-50 border border-rose-100 rounded-xl px-4 py-3 flex items-start gap-2 animate-in fade-in">
                            <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                            <p className="text-rose-700 text-sm font-semibold">{error}</p>
                        </div>
                    )}

                    {/* 4. Zero state — "Use my location" button + OR divider */}
                    {showZeroState && (
                        <>
                            <button
                                onClick={detectLocation}
                                className="w-full flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-3.5 px-4 rounded-2xl transition-all active:scale-95"
                            >
                                <Navigation className="w-5 h-5" />
                                Use my location (recommended)
                            </button>
                            <p className="text-xs text-center font-medium text-slate-400">
                                We use your location only to detect your college.
                            </p>
                            <div className="relative flex items-center py-1">
                                <div className="flex-grow border-t border-slate-100" />
                                <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase tracking-wider">Or</span>
                                <div className="flex-grow border-t border-slate-100" />
                            </div>
                        </>
                    )}

                    {/* 5. Manual search input — always visible except during locating / candidate list */}
                    {(isManualVisible || showZeroState) && (
                        <div className="flex flex-col gap-1.5">
                            {isManualVisible && (
                                <label className="text-slate-700 font-bold text-sm ml-1">Enter your college manually</label>
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
                    )}
                </div>

                {/* ── Scrollable manual results ── */}
                <div className="flex-1 overflow-y-auto px-5 pb-10">
                    {isFetchingList ? (
                        <div className="flex justify-center mt-8">
                            <Loader2 className="w-6 h-6 animate-spin text-indigo-300" />
                        </div>
                    ) : searchQuery.trim() !== "" && filteredColleges.length === 0 ? (
                        <p className="text-center text-slate-500 mt-10 text-sm font-medium">
                            No colleges found. Check the spelling or try a shorter keyword.
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
