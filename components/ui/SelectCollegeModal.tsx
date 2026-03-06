"use client";

import { useState, useEffect, useRef } from "react";
import { useCollege } from "@/contexts/CollegeContext";
import { Search, MapPin, X, Navigation, Loader2, AlertCircle } from "lucide-react";
import { getLocalColleges } from "@/lib/utils/colleges";
import { College } from "@/lib/types";
import { useDetectCollegeByLocation } from "@/lib/hooks/useDetectCollegeByLocation";

interface SelectCollegeModalProps {
    isOpen: boolean;
    onClose?: () => void;
}

export function SelectCollegeModal({ isOpen, onClose }: SelectCollegeModalProps) {
    const { setSelectedCollege } = useCollege();
    const { detectLocation, isLocating, isTakingLong, detectedCollege, error, resetDetection } = useDetectCollegeByLocation();

    // Client-Side Search State
    const [allColleges, setAllColleges] = useState<College[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isFetchingInitial, setIsFetchingInitial] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Fetch all colleges exactly once on mount if modal is open
    useEffect(() => {
        if (!isOpen) return;

        const fetchAllColleges = async () => {
            if (allColleges.length > 0) return; // already fetched

            setIsFetchingInitial(true);
            try {
                // Fetch master list directly from local CSV without hitting Firebase!
                const colList = await getLocalColleges();
                console.log("🏫 Fetched all colleges from local CSV:", colList.length);
                setAllColleges(colList);
            } catch (err) {
                console.error("Failed to load colleges master list", err);
            } finally {
                setIsFetchingInitial(false);
            }
        };

        fetchAllColleges();
    }, [isOpen, allColleges.length]);

    if (!isOpen) return null;

    const filteredColleges = searchQuery.trim() === ""
        ? []
        : allColleges.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase().trim())).slice(0, 15);

    const handleSelect = (college: College) => {
        setSelectedCollege(college);
        resetDetection();
        setSearchQuery("");
        if (onClose) onClose();
    };

    const handleConfirmDetected = () => {
        if (detectedCollege) {
            handleSelect(detectedCollege);
        }
    };

    const handleRejectDetected = () => {
        resetDetection();
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    };

    return (
        <div className={`fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/40 backdrop-blur-sm mx-auto w-full md:max-w-md`}>
            <div className={`bg-white w-full flex flex-col animate-in slide-in-from-bottom-full duration-300 shadow-2xl h-full rounded-none md:h-[85vh] md:rounded-t-3xl md:border-t md:border-indigo-100`}>

                {/* Header */}
                <div className={`flex items-center justify-between px-6 py-5 border-b border-indigo-50 mt-8 md:mt-0`}>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800" style={{ fontFamily: "Outfit, sans-serif" }}>
                            Select your campus
                        </h2>
                    </div>
                    {onClose && (
                        <button onClick={onClose} className="p-2 bg-slate-100 lg:hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                <div className="p-5 flex flex-col gap-4 shrink-0">

                    {isLocating ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-4 bg-indigo-50 border border-indigo-100 rounded-2xl animate-in fade-in">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                            <p className="text-indigo-800 font-bold text-center px-4">Detecting your college using location...</p>
                            {isTakingLong && (
                                <p className="text-indigo-500 text-xs font-medium px-6 text-center">Location is taking longer than expected. Please wait...</p>
                            )}
                        </div>
                    ) : detectedCollege ? (
                        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex flex-col items-center text-center gap-3 animate-in fade-in slide-in-from-top-4">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <MapPin className="text-green-600 w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-500 mb-1 tracking-wider uppercase">Detected college near you</h3>
                                <h2 className="text-xl font-black text-slate-800" style={{ fontFamily: "Outfit, sans-serif" }}>
                                    {detectedCollege.name}
                                </h2>
                                {detectedCollege.city && <p className="text-slate-500 mt-0.5 font-medium">{detectedCollege.city}</p>}
                            </div>
                            <div className="flex flex-col gap-2 w-full mt-2">
                                <button onClick={handleConfirmDetected} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-indigo hover:bg-indigo-700 transition active:scale-95">
                                    Use this college
                                </button>
                                <button onClick={handleRejectDetected} className="flex-1 py-2 text-slate-500 font-bold rounded-xl transition hover:text-indigo-600 active:scale-95">
                                    Choose a different college
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {error ? (
                                <div className="text-center text-rose-600 mb-2 mt-2 font-bold bg-rose-50 py-4 px-4 rounded-xl border border-rose-100 animate-in fade-in flex flex-col items-center justify-center gap-2">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="w-5 h-5" />
                                        <span>{error}</span>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <button
                                        onClick={detectLocation}
                                        className="w-full flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-3.5 px-4 rounded-2xl transition-all"
                                    >
                                        <Navigation className="w-5 h-5" />
                                        Use my location (recommended)
                                    </button>
                                    <p className="text-xs text-center font-medium text-slate-500">
                                        We use your location only to detect your college and show nearby rentals.
                                    </p>
                                    <div className="relative flex items-center py-2">
                                        <div className="flex-grow border-t border-slate-100"></div>
                                        <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase tracking-wider">Or</span>
                                        <div className="flex-grow border-t border-slate-100"></div>
                                    </div>
                                </>
                            )}

                            <div className="flex flex-col gap-1.5">
                                {error && <label className="text-slate-800 font-bold ml-1">Enter your college manually</label>}
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-300" />
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        placeholder="Enter college manually..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        disabled={isFetchingInitial}
                                        className="w-full h-14 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 font-medium focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto px-5 pb-10">
                    {isFetchingInitial ? (
                        <div className="flex justify-center mt-8">
                            <Loader2 className="w-6 h-6 animate-spin text-indigo-300" />
                        </div>
                    ) : searchQuery.trim() !== "" && filteredColleges.length === 0 ? (
                        <p className="text-center text-slate-500 mt-10 text-sm font-medium">No colleges found. Check the spelling or try a nearby campus.</p>
                    ) : (
                        <div className="space-y-2">
                            {filteredColleges.map((college) => (
                                <button
                                    key={college.id}
                                    onClick={() => handleSelect(college)}
                                    className="w-full text-left p-4 rounded-xl border bg-white border-slate-100 shadow-sm hover:border-indigo-400 hover:shadow-indigo transition-all flex items-center gap-3 active:scale-95 group"
                                >
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-indigo-50 text-indigo-600 font-black group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                        <span className="text-base">{college.name.charAt(0)}</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-700 group-hover:text-indigo-900 transition-colors">{college.name}</p>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                            <span>{college.city || "City"}</span>
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
