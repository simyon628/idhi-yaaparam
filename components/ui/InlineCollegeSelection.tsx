"use client";

import { useState, useEffect, useRef } from "react";
import { useCollege } from "@/contexts/CollegeContext";
import { Search, MapPin, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { College } from "@/lib/types";
import { useBackgroundCollegeDetection } from "@/lib/hooks/useBackgroundCollegeDetection";

function formatDistance(m: number): string {
    if (m < 1000) return `about ${Math.round(m)} m away`;
    return `about ${(m / 1000).toFixed(1)} km away`;
}

export function InlineCollegeSelection() {
    const { setSelectedCollege } = useCollege();
    const { status: detectionStatus, college: autoDetectedCollege, startDetection } = useBackgroundCollegeDetection();

    // Trigger explicit location prompt strictly 1-time when user clicks the button mounting this component
    useEffect(() => {
        startDetection();
    }, []); // Empty dependency array as explicitly requested

    // Manual search state
    const [allColleges, setAllColleges] = useState<College[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isFetchingList, setIsFetchingList] = useState(false);
    const [showManual, setShowManual] = useState(false);

    // If still detecting, wait up to 5s then fall through to manual
    const [waitExpired, setWaitExpired] = useState(false);
    const waitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Start the 9-second fallback timer
    useEffect(() => {
        if (detectionStatus === "detecting") {
            waitTimer.current = setTimeout(() => setWaitExpired(true), 9_000);
        }
        return () => {
            if (waitTimer.current) clearTimeout(waitTimer.current);
        };
    }, [detectionStatus]);

    // Load full Firestore list for manual search (once)
    useEffect(() => {
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

        if (allColleges.length === 0) fetchColleges();
    }, [allColleges.length]);

    const filteredColleges: College[] = searchQuery.trim() === ""
        ? []
        : allColleges
            .filter((c: College) => {
                const searchLower = searchQuery.toLowerCase().trim();
                const nameLower = c.name.toLowerCase();

                // Exact substring match
                if (nameLower.includes(searchLower)) return true;

                // Exact acronym match
                const acronym = nameLower.split(/[\s-]+/).map(word => word[0]).join('');
                if (acronym.includes(searchLower)) return true;

                // All words present anywhere
                const searchWords = searchLower.split(/\s+/).filter(Boolean);
                const allWordsMatch = searchWords.length > 0 && searchWords.every(word => nameLower.includes(word));
                if (allWordsMatch) return true;

                // Special Aliases for famous Indian engineering acronyms 
                if (searchLower === 'srkr' && nameLower.includes('sagi')) return true;
                if (searchLower === 'iit' && nameLower.includes('indian institute of technology')) return true;
                if (searchLower === 'nit' && nameLower.includes('national institute of technology')) return true;
                if (searchLower === 'iiit' && nameLower.includes('indian institute of information technology')) return true;
                if (searchLower === 'bits' && nameLower.includes('birla institute of technology')) return true;

                return false;
            })
            .slice(0, 5); // Limit max inline results

    const confirmAutoDetected = () => {
        if (!autoDetectedCollege) return;
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
    };

    const handleManualSelect = (college: College) => {
        setSelectedCollege(college);
    };

    const openManualSearch = () => {
        setShowManual(true);
        setTimeout(() => searchInputRef.current?.focus(), 80);
    };

    const isStillDetecting = detectionStatus === "detecting" && !waitExpired;
    const showConfirmation = detectionStatus === "ready" && !!autoDetectedCollege && !showManual;
    const showManualSearchUI = showManual || detectionStatus === "failed" || (detectionStatus === "detecting" && waitExpired) || detectionStatus === "idle";

    return (
        <div className="w-full text-left animate-in fade-in slide-in-from-top-4 duration-500">
            {/* ── State 1: Still detecting in background ── */}
            {isStillDetecting && (
                <div className="flex flex-col items-center justify-center py-6 gap-3 bg-indigo-50 border border-indigo-100 rounded-2xl">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    <p className="text-indigo-800 font-bold text-center px-4">Detecting your college…</p>
                </div>
            )}

            {/* ── State 2: Confirmation ── */}
            {showConfirmation && (
                <div className="bg-white border-2 border-indigo-100 rounded-3xl p-5 flex flex-col gap-4 shadow-xl shadow-indigo-500/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
                    <div className="flex flex-col gap-3 relative z-10">
                        <div className="flex items-start gap-3">
                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-100 shadow-inner">
                                <CheckCircle2 className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-800 leading-tight mb-2">
                                    We detected your college: <span className="text-indigo-600">{autoDetectedCollege!.name}</span> ({formatDistance(autoDetectedCollege!.distanceM)}).
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 mt-2">
                            <button
                                onClick={confirmAutoDetected}
                                className="w-full py-4 gradient-indigo text-white font-black text-base rounded-2xl shadow-indigo transition-all active:scale-95"
                            >
                                Yes, this is my college
                            </button>
                            <button
                                onClick={openManualSearch}
                                className="w-full py-2.5 text-slate-400 text-xs font-black uppercase tracking-widest rounded-xl hover:text-slate-600 hover:bg-slate-50 transition-all"
                            >
                                This is not my college
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── State 3: Manual search ── */}
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
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-300" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="e.g., SRKR Engineering College"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                disabled={isFetchingList}
                                className="w-full h-14 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 font-bold focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all outline-none shadow-inner"
                            />
                        </div>
                    </div>

                    {/* Inline Search Results */}
                    {isFetchingList ? (
                        <div className="flex justify-center py-4">
                            <Loader2 className="w-6 h-6 animate-spin text-indigo-300" />
                        </div>
                    ) : searchQuery.trim() !== "" && filteredColleges.length === 0 ? (
                        <p className="text-center text-slate-400 py-4 text-xs font-bold">
                            No colleges found. Try a different acronym.
                        </p>
                    ) : (
                        <div className="space-y-2 mt-2 max-h-64 overflow-y-auto no-scrollbar">
                            {filteredColleges.map(college => (
                                <button
                                    key={college.id}
                                    onClick={() => handleManualSelect(college)}
                                    className="w-full text-left p-3 rounded-xl border bg-white border-slate-100 shadow-sm hover:border-indigo-400 transition-all flex items-center gap-3 active:scale-[0.98] group"
                                >
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-indigo-50 text-indigo-600 font-black group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                        <span className="text-base">{college.name.charAt(0)}</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-700 text-sm group-hover:text-indigo-900 transition-colors line-clamp-1">{college.name}</p>
                                        <div className="flex items-center gap-1 text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                            <span>{college.city || "Campus"}</span>
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
            )}
        </div>
    );
}
