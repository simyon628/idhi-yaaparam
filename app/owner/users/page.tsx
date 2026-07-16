"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, limit, startAfter } from "firebase/firestore";
import { theme } from "@/lib/theme.config";
import { Search, ChevronRight, User, ShieldCheck, Phone, Loader2, ArrowLeft } from "lucide-react";
import type { User as UserType } from "@/lib/types";

type College = { id: string; name: string; acronym: string };

export default function UserDatabase() {
    const [colleges, setColleges] = useState<College[]>([]);
    const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
    const [selectedDept, setSelectedDept] = useState<string | null>(null);
    const [students, setStudents] = useState<UserType[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // 1. Load Colleges
    useEffect(() => {
        async function fetchColleges() {
            if (!db) return;
            try {
                const snap = await getDocs(query(collection(db, "colleges"), orderBy("name", "asc")));
                setColleges(snap.docs.map(d => ({ id: d.id, ...d.data() } as unknown as College)));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchColleges();
    }, []);

    // 2. Load Students when College & Dept selected
    useEffect(() => {
        if (!selectedCollege || !selectedDept) return;
        
        async function fetchStudents() {
            if (!db) return;
            setLoading(true);
            try {
                // Requires composite index: college ASC, department ASC, createdAt DESC
                const q = query(
                    collection(db, "users"),
                    where("college", "==", selectedCollege?.acronym || selectedCollege?.id),
                    where("department", "==", selectedDept),
                    orderBy("createdAt", "desc"),
                    limit(100)
                );
                const snap = await getDocs(q);
                setStudents(snap.docs.map(d => ({ uid: d.id, ...d.data() } as unknown as UserType)));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchStudents();
    }, [selectedCollege, selectedDept]);

    // Hardcoded depts for simplicity, could be dynamic in future
    const DEPARTMENTS = ["CSE", "ECE", "MECH", "CIVIL", "EEE", "IT", "AI/ML", "MBA"];

    if (loading && !selectedCollege && !selectedDept) {
        return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
    }

    return (
        <div className="space-y-4">
            {/* Search Bar (Global) */}
            <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-2">
                <Search className="w-5 h-5 text-slate-400 ml-2" />
                <input 
                    type="text" 
                    placeholder="Search any student by roll number..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none font-bold text-sm py-2 text-slate-700"
                />
            </div>

            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-100 px-4 py-2 rounded-xl">
                <button onClick={() => { setSelectedCollege(null); setSelectedDept(null); }} className={`hover:text-blue-600 ${!selectedCollege ? 'text-blue-600' : ''}`}>
                    All Colleges
                </button>
                {selectedCollege && (
                    <>
                        <ChevronRight className="w-3 h-3" />
                        <button onClick={() => setSelectedDept(null)} className={`hover:text-blue-600 ${!selectedDept ? 'text-blue-600' : ''}`}>
                            {selectedCollege.acronym || "College"}
                        </button>
                    </>
                )}
                {selectedDept && (
                    <>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-blue-600">{selectedDept}</span>
                    </>
                )}
            </div>

            {/* View 1: Colleges */}
            {!selectedCollege && (
                <div className="grid gap-3">
                    {colleges.map(c => (
                        <div 
                            key={c.id} 
                            onClick={() => setSelectedCollege(c)}
                            className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between cursor-pointer hover:border-blue-200 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-lg" style={{ background: theme.brand.gradient }}>
                                    {c.acronym?.substring(0,2) || "U"}
                                </div>
                                <div>
                                    <div className="font-extrabold text-slate-800 text-sm">{c.name}</div>
                                    <div className="text-xs font-bold text-slate-400">{c.acronym}</div>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-300" />
                        </div>
                    ))}
                </div>
            )}

            {/* View 2: Departments */}
            {selectedCollege && !selectedDept && (
                <div className="grid grid-cols-2 gap-3">
                    {DEPARTMENTS.map(dept => (
                        <div 
                            key={dept} 
                            onClick={() => setSelectedDept(dept)}
                            className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between cursor-pointer hover:border-blue-200 transition-colors"
                        >
                            <span className="font-extrabold text-slate-700 text-sm">{dept}</span>
                            <ChevronRight className="w-4 h-4 text-slate-300" />
                        </div>
                    ))}
                </div>
            )}

            {/* View 3: Students Table */}
            {selectedCollege && selectedDept && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    {loading ? (
                        <div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
                    ) : students.length === 0 ? (
                        <div className="p-10 text-center text-slate-500 font-bold text-sm">No students found in this department.</div>
                    ) : (
                        <div className="divide-y divide-slate-50">
                            {students.map(s => (
                                <div key={s.uid} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                                    {s.idPhotoUrl ? (
                                        <img src={s.idPhotoUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                                            <User className="w-5 h-5 text-slate-400" />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-extrabold text-slate-800 text-sm">{s.rollNumber || "No Roll"}</span>
                                            {s.isVerified && <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />}
                                            {s.isOwner && <span className="bg-amber-100 text-amber-700 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">Owner</span>}
                                        </div>
                                        <div className="text-[11px] font-bold text-slate-400 flex items-center gap-2 mt-0.5">
                                            <span>Year {s.year || "?"}</span>
                                            {s.phoneNumber && (
                                                <span className="flex items-center gap-0.5 text-slate-500">
                                                    <Phone className="w-2.5 h-2.5" /> {s.phoneNumber}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs font-black text-blue-600">{s.overallRating ? `⭐ ${s.overallRating}` : "New"}</div>
                                        <div className="text-[10px] font-medium text-slate-400 mt-0.5">{s.reviewCount || 0} reviews</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
