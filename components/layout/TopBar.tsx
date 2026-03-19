"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCollege } from "@/contexts/CollegeContext";
import { MapPin, ChevronDown, Bell } from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { InlineCollegeSelection } from "@/components/ui/InlineCollegeSelection";
import { X } from "lucide-react";

export function TopBar() {
    const { selectedCollege, setSelectedCollege, isReady } = useCollege();
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

    if (!isReady) return null; // Avoid hydration mismatch

    // Close modal when college changes
    useEffect(() => {
        if (selectedCollege) {
            setShowCollegeModal(false);
        }
    }, [selectedCollege]);

    return (
        <>
            <div className="fixed top-0 left-0 right-0 z-40 glass border-b border-white/60 px-5 py-3.5 flex items-center justify-between max-w-md mx-auto shadow-sm transition-all duration-300">
                {/* Left: Logo */}
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg gradient-indigo flex items-center justify-center shadow-indigo shrink-0">
                        <span className="text-base text-white">🚀</span>
                    </div>
                    <span
                        className="text-base font-black text-slate-800 cursor-pointer"
                        style={{ fontFamily: "Outfit, sans-serif" }}
                    >
                        Idhi Yaaparam
                    </span>
                </div>

                {/* Right: Notification Bell */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => router.push("/notifications")}
                        className="relative p-2.5 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <Bell className="w-5 h-5 text-slate-700" />
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
                        )}
                    </button>
                    
                    {/* Minimalist College Picker (Text only) */}
                    <button
                        onClick={() => setShowCollegeModal(true)}
                        className="flex items-center gap-1 pl-2 border-l border-slate-200"
                    >
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[80px]">
                            {selectedCollege?.name?.split(' ')[0] || "Campus"}
                        </span>
                        <ChevronDown className="w-3 h-3 text-slate-300" />
                    </button>
                </div>
            </div>

            {/* College Selection Modal */}
            {showCollegeModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-5 animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl relative">
                        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
                            <h2 className="text-lg font-black text-slate-800" style={{ fontFamily: "Outfit, sans-serif" }}>Change College</h2>
                            <button 
                                onClick={() => setShowCollegeModal(false)}
                                className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-5 max-h-[70vh] overflow-y-auto override-detector-margins">
                            <InlineCollegeSelection />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
