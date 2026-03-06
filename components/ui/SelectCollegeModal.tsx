"use client";

import { useState, useEffect } from "react";
import { useCollege } from "@/contexts/CollegeContext";
import { Search, MapPin, X, Navigation, Loader2 } from "lucide-react";
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { College } from "@/lib/types";
import { useDetectCollegeByLocation } from "@/lib/hooks/useDetectCollegeByLocation";

interface SelectCollegeModalProps {
    isOpen: boolean;
    onClose?: () => void;
    forceFullScreen?: boolean;
}

export function SelectCollegeModal({ isOpen, onClose, forceFullScreen }: SelectCollegeModalProps) {
    const { setSelectedCollege } = useCollege();
    const { detectLocation, isLocating, detectedCollege, error, resetDetection } = useDetectCollegeByLocation();

    const [searchQuery, setSearchQuery] = useState("");
    const [fetchedColleges, setFetchedColleges] = useState<College[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Prompt the user if GPS found a college
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        if (detectedCollege) {
            setShowConfirm(true);
        }
    }, [detectedCollege]);

    // Firestore Search fallback, assuming 'name' search. 
    // In production, we'd use Algolia or client-side filter with pre-fetched list.
    useEffect(() => {
        const fetchColleges = async () => {
            if (!searchQuery.trim()) {
                setFetchedColleges([]);
                return;
            }
            if (!db) return;
            setIsSearching(true);
            try {
                // simple startAt endAt query for prefixes
                const q = query(
                    collection(db, "colleges"),
                    orderBy("name"),
                    where("name", ">=", searchQuery),
                    where("name", "<=", searchQuery + '\uf8ff'),
                    limit(10)
                );
                const snapshot = await getDocs(q);
                const colList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as College));
                setFetchedColleges(colList);
            } catch (err) {
                console.error("Failed to search colleges", err);
            }
            setIsSearching(false);
        };

        const timer = setTimeout(() => {
            if (searchQuery.trim().length >= 2) {
                fetchColleges();
            } else {
                setFetchedColleges([]);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(timer);
    }, [searchQuery]);

    if (!isOpen) return null;

    const handleSelect = (college: College) => {
        setSelectedCollege(college);
        resetDetection();
        setShowConfirm(false);
        if (onClose) onClose();
    };

    const handleConfirmDetected = () => {
        if (detectedCollege) {
            handleSelect(detectedCollege);
        }
    };

    const handleRejectDetected = () => {
        resetDetection();
        setShowConfirm(false);
    };

    return (
        <div className={`fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/40 backdrop-blur-sm max-w-md mx-auto ${forceFullScreen ? 'h-screen' : ''}`}>
            <div className={`bg-white rounded-t-3xl w-full flex flex-col animate-in slide-in-from-bottom-full duration-300 shadow-2xl ${forceFullScreen ? 'h-full rounded-none' : 'h-[85vh] border-t border-indigo-100'}`}>

                {/* Header */}
                <div className={`flex items-center justify-between px-6 py-5 border-b border-indigo-50 ${forceFullScreen ? 'mt-8' : ''}`}>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800" style={{ fontFamily: "Outfit, sans-serif" }}>
                            Select your campus
                        </h2>
                        <p className="text-sm font-semibold text-slate-500 mt-1">
                            Find your college to see items near you.
                        </p>
                    </div>
                    {!forceFullScreen && onClose && (
                        <button onClick={onClose} className="p-2 bg-slate-100 lg:hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                <div className="p-5 flex flex-col gap-4">
                    {/* Location Button */}
                    {!showConfirm ? (
                        <button
                            onClick={detectLocation}
                            disabled={isLocating}
                            className="w-full flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-3.5 px-4 rounded-2xl transition-all"
                        >
                            {isLocating ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Navigation className="w-5 h-5" />
                            )}
                            {isLocating ? "Detecting location..." : "Use my location to detect college"}
                        </button>
                    ) : (
                        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex flex-col items-center text-center gap-3">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <MapPin className="text-green-600 w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">We detected {detectedCollege?.name}</h3>
                                <p className="text-sm text-slate-600">Use this college?</p>
                            </div>
                            <div className="flex gap-3 w-full mt-2">
                                <button onClick={handleRejectDetected} className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl">
                                    No, thanks
                                </button>
                                <button onClick={handleConfirmDetected} className="flex-1 py-2.5 bg-green-600 text-white font-bold rounded-xl shadow-sm hover:bg-green-700 transition">
                                    Yes, use this
                                </button>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="text-center text-red-500 text-sm font-medium bg-red-50 py-2 rounded-xl">
                            {error}
                        </div>
                    )}

                    <div className="relative flex items-center py-2">
                        <div className="flex-grow border-t border-slate-100"></div>
                        <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase tracking-wider">or search manually</span>
                        <div className="flex-grow border-t border-slate-100"></div>
                    </div>

                    {/* Search Input */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-300" />
                        <input
                            type="text"
                            placeholder="Search your college (e.g., SRK...)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-14 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 font-medium focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto px-5 pb-10">
                    {isSearching ? (
                        <div className="flex justify-center mt-8">
                            <Loader2 className="w-6 h-6 animate-spin text-indigo-300" />
                        </div>
                    ) : searchQuery.trim().length >= 2 && fetchedColleges.length === 0 ? (
                        <p className="text-center text-slate-500 mt-10 text-sm font-medium">No colleges found matching "{searchQuery}"</p>
                    ) : (
                        <div className="space-y-2">
                            {fetchedColleges.map((college) => (
                                <button
                                    key={college.id}
                                    onClick={() => handleSelect(college)}
                                    className="w-full text-left p-4 rounded-xl border bg-white border-transparent hover:border-indigo-100 hover:bg-slate-50 transition-all flex items-center gap-3"
                                >
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-indigo-50 border border-indigo-100">
                                        <span className="text-lg">🎓</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-700">{college.name}</p>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                            <span>{college.city || "City"}</span>
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
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
