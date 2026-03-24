"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, getDoc, doc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "sonner";
import { ChevronLeft, Loader2, Send, MapPin, GraduationCap, Laptop, BookOpen, Calculator, PenTool, CheckSquare, GraduationCap as LabCoat, MoreHorizontal } from "lucide-react";
import { useCollege } from "@/contexts/CollegeContext";
import { DEPARTMENTS } from "@/lib/constants";
import { useCampusBlocks } from "@/lib/hooks/useCampusBlocks";
import { CATEGORIES } from "@/components/ui/CategoryGrid";

export default function NewRequestPage() {
    const router = useRouter();
    const { selectedCollege, isReady } = useCollege();
    const { formatting: dynamicBlocks } = useCampusBlocks(selectedCollege);

    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("");
    const [block, setBlock] = useState("");
    const [department, setDepartment] = useState(DEPARTMENTS[0]);
    const [urgency, setUrgency] = useState<"Normal" | "Urgent">("Normal");
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        if (!auth) return;
        const unsub = onAuthStateChanged(auth as any, (user) => {
            setCurrentUserId(user?.uid ?? null);
        });
        return () => unsub();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUserId || !selectedCollege) {
            toast.error("Please login first");
            return;
        }

        if (!title || !category || !block) {
            toast.error("Please fill all required fields");
            return;
        }

        setLoading(true);
        try {
            const selectedCat = CATEGORIES.find(c => c.name === category);
            
            await addDoc(collection(db as any, "requests"), {
                requesterId: currentUserId,
                title,
                collegeId: selectedCollege.id,
                collegeName: selectedCollege.name,
                categoryId: selectedCat?.id || "others",
                categoryName: category,
                block,
                department,
                urgency,
                status: "open",
                createdAt: serverTimestamp(),
            });

            toast.success("🚀 Request posted! Others can now help you.");
            router.push("/requests");
        } catch (error: any) {
            console.error(error);
            toast.error("Failed to post request");
        } finally {
            setLoading(false);
        }
    };

    if (!isReady || !selectedCollege) return null;

    return (
        <div className="flex-1 flex flex-col min-h-screen bg-slate-50 relative">
             <header className="px-5 pt-12 pb-6 flex items-center gap-4 border-b border-indigo-100 bg-white/60 backdrop-blur-md sticky top-0 z-20">
                <button onClick={() => router.back()} className="p-2.5 bg-white border border-indigo-100 rounded-xl active:scale-95 transition-all text-slate-500 shadow-sm">
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-slate-800 leading-none" style={{ fontFamily: "Outfit, sans-serif" }}>Request Item</h1>
                    <p className="text-[11px] font-black text-indigo-500 uppercase tracking-widest mt-1.5">Ask your college mates</p>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="flex-1 px-5 space-y-7 py-8 max-w-md mx-auto w-full pb-20">
                
                {/* Information Card */}
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                        <span className="text-xl">💡</span>
                    </div>
                    <p className="text-[11px] font-bold text-amber-700 leading-relaxed">
                        Can't find what you need in the marketplace? Request it here. Nearby students will be notified!
                    </p>
                </div>

                {/* Title */}
                <div className="space-y-2.5">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">What do you need? *</label>
                    <input
                        type="text"
                        placeholder="e.g. Need Casio fx-991 for M1 exam"
                        className="w-full bg-white/70 backdrop-blur-md border border-indigo-50 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 rounded-2xl h-14 px-5 text-slate-800 placeholder-slate-400 font-bold outline-none transition-all shadow-inner"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>

                {/* Category */}
                <div className="space-y-2.5">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">Category *</label>
                    <div className="grid grid-cols-2 gap-2">
                        {CATEGORIES.map(c => (
                            <button
                                key={c.id}
                                type="button"
                                onClick={() => setCategory(c.name)}
                                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[11px] font-black uppercase tracking-wider transition-all ${
                                    category === c.name ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo/20" : "bg-white border-slate-100 text-slate-500 hover:border-indigo-200"
                                }`}
                            >
                                <span className={`text-sm ${category === c.name ? "opacity-100" : "opacity-70 saturate-50"}`}>{c.icon}</span>
                                {c.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Block Selector */}
                <div className="space-y-2.5">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5 pl-1">
                        <MapPin className="w-3.5 h-3.5" /> Where should they meet you? *
                    </label>
                    <input 
                        type="text"
                        value={block}
                        onChange={e => setBlock(e.target.value)}
                        placeholder="e.g. Main Block canteen, Library..."
                        className="w-full bg-white/70 backdrop-blur-md border border-indigo-50 rounded-2xl h-14 px-5 text-slate-800 placeholder-slate-400 font-bold outline-none shadow-inner"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {dynamicBlocks.slice(0, 4).map(b => (
                            <button key={b} type="button" onClick={() => setBlock(b)} className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-600 rounded-full transition-colors">
                                {b}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Urgency */}
                <div className="space-y-2.5">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">Urgency</label>
                    <div className="flex gap-3">
                        {["Normal", "Urgent"].map(u => (
                            <button
                                key={u}
                                type="button"
                                onClick={() => setUrgency(u as any)}
                                className={`flex-1 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all ${
                                    urgency === u 
                                        ? u === "Urgent" ? "bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-200" : "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200"
                                        : "bg-white border-slate-100 text-slate-400"
                                }`}
                            >
                                {u === "Urgent" && <span className="mr-1">🔥</span>} {u}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Department */}
                <div className="space-y-2.5">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">Target Department</label>
                    <select
                        value={department}
                        onChange={e => setDepartment(e.target.value)}
                        className="w-full bg-white/70 border border-indigo-50 rounded-2xl h-14 px-4 text-slate-700 font-bold outline-none appearance-none shadow-inner"
                    >
                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>

                {/* Submit */}
                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-16 rounded-2xl gradient-indigo text-white font-black text-base shadow-indigo flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-all"
                    >
                        {loading ? <Loader2 className="animate-spin w-6 h-6" /> : <><Send className="w-5 h-5" /> Post Request</>}
                    </button>
                </div>
            </form>
        </div>
    );
}
