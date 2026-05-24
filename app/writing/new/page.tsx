"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { toast } from "sonner";
import { ChevronLeft, Loader2, IndianRupee, PenTool, Calendar, BookOpen } from "lucide-react";
import { useCollege } from "@/contexts/CollegeContext";
import { DEPARTMENTS } from "@/lib/constants";

const WRITING_TYPES = ["Assignment", "Record", "Project Report", "Other"];

export default function NewWritingJobPage() {
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState("");
    const [type, setType] = useState(WRITING_TYPES[0]);
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [deadlineDate, setDeadlineDate] = useState("");
    const [department, setDepartment] = useState(DEPARTMENTS[0]); // Default CSE

    const router = useRouter();
    const { selectedCollege, isReady } = useCollege();
    const userId = auth?.currentUser?.uid;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title || !description || !price || !deadlineDate || !selectedCollege) {
            toast.error("Please fill all required fields");
            return;
        }

        const deadlineObj = new Date(deadlineDate);
        if (deadlineObj < new Date()) {
            toast.error("Deadline must be in the future");
            return;
        }

        setLoading(true);
        try {
            if (!userId || !db) throw new Error("Auth error");

            // Check if user is verified
            const userDocSnap = await getDoc(doc(db as any, "users", userId));
            if (!userDocSnap.exists() || (!userDocSnap.data().isVerified && !userDocSnap.data().verified)) {
                toast.error("Please verify your student ID before posting a job.");
                setLoading(false);
                return;
            }

            await addDoc(collection(db, "writing_jobs"), {
                title,
                type,
                description,
                price: parseInt(price),
                deadline: deadlineObj, // Firestore will auto-convert valid JS Dates
                college: selectedCollege.name,
                department,
                posterId: userId,
                workerId: null,
                status: "open",
                createdAt: serverTimestamp(),
            });

            toast.success("Bounty posted successfully! 🎉");
            router.push("/writing");
        } catch (error) {
            console.error("Post error:", error);
            toast.error("Failed to post job. Try again.");
        } finally {
            setLoading(false);
        }
    };

    if (isReady && !selectedCollege) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-screen text-center px-6">
                <button onClick={() => router.push("/")} className="gradient-indigo text-white px-8 py-3.5 rounded-2xl font-bold">Go to Home</button>
            </div>
        )
    }

    // Set min date for the HTML5 date picker to today
    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="flex-1 flex flex-col min-h-screen bg-slate-50 relative">
            <header className="px-5 pt-12 pb-6 flex items-center gap-4 border-b border-indigo-100 bg-white/60 backdrop-blur-md sticky top-0 z-20">
                <button
                    onClick={() => router.back()}
                    className="p-2.5 bg-white border border-indigo-100 rounded-xl active:scale-95 transition-all text-slate-500 hover:text-indigo-600 shadow-sm"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-slate-800 leading-none" style={{ fontFamily: "Outfit, sans-serif" }}>Post a Bounty</h1>
                    <p className="text-[11px] font-black text-indigo-500 uppercase tracking-widest mt-1.5">Get your work done</p>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="flex-1 px-5 py-8 pb-16 space-y-7 max-w-md mx-auto w-full relative z-10">
                {/* College Read-only */}
                <div className="flex items-center gap-4 p-5 bg-white/70 backdrop-blur-xl rounded-3xl border border-indigo-50 shadow-sm relative overflow-hidden">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 shadow-inner">
                        <PenTool className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Posting to Campus</p>
                        <p className="text-[15px] font-bold text-indigo-700 mt-0.5">{selectedCollege?.name}</p>
                    </div>
                </div>

                {/* Title */}
                <div className="space-y-2.5">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">Title *</label>
                    <input
                        type="text"
                        placeholder="e.g. 3rd Year OS Lab Record"
                        className="w-full bg-white/70 backdrop-blur-md border border-indigo-50 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 rounded-2xl h-14 px-5 text-slate-800 placeholder-slate-400 font-bold outline-none transition-all shadow-inner"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={50}
                    />
                </div>

                {/* Type & Dept Row */}
                <div className="flex gap-4">
                    <div className="space-y-2.5 flex-1 w-1/2">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">Work Type *</label>
                        <select
                            value={type}
                            onChange={e => setType(e.target.value)}
                            className="w-full bg-white/70 backdrop-blur-md border border-indigo-50 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 rounded-2xl h-14 px-4 text-slate-700 font-bold outline-none appearance-none shadow-inner transition-all"
                        >
                            {WRITING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2.5 flex-1 w-1/2">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1 flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> Dept</label>
                        <select
                            value={department}
                            onChange={e => setDepartment(e.target.value)}
                            className="w-full bg-white/70 backdrop-blur-md border border-indigo-50 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 rounded-2xl h-14 px-4 text-slate-700 font-bold outline-none appearance-none shadow-inner transition-all"
                        >
                            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-2.5">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1 flex justify-between">
                        <span>Details *</span>
                        <span className="text-slate-300 font-medium">{description.length}/300</span>
                    </label>
                    <textarea
                        placeholder="Explain the requirements, page count, language, etc."
                        className="w-full bg-white/70 backdrop-blur-md border border-indigo-50 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 rounded-2xl p-5 text-sm text-slate-800 placeholder-slate-400 font-semibold outline-none transition-all shadow-inner resize-none h-32 leading-relaxed"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        maxLength={300}
                    />
                </div>

                {/* Price & Deadline Row */}
                <div className="flex gap-4">
                    <div className="space-y-2.5 w-1/2">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">Bounty Price *</label>
                        <div className="flex items-center gap-2 bg-white/70 backdrop-blur-md rounded-2xl border border-indigo-50 focus-within:border-indigo-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-100 h-14 px-4 shadow-inner transition-all">
                            <IndianRupee className="w-5 h-5 text-indigo-500 shrink-0" />
                            <input
                                type="number"
                                placeholder="350"
                                min="10"
                                max="10000"
                                className="w-full bg-transparent text-slate-800 placeholder-slate-400 font-black text-lg outline-none"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2.5 flex-1">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Needed By *</label>
                        <input
                            type="date"
                            min={today}
                            className="w-full bg-white/70 backdrop-blur-md border border-indigo-50 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 rounded-2xl h-14 px-4 text-slate-700 font-bold outline-none shadow-inner transition-all"
                            value={deadlineDate}
                            onChange={(e) => setDeadlineDate(e.target.value)}
                        />
                    </div>
                </div>

                <div className="pt-8">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-16 rounded-2xl gradient-indigo text-white font-black text-base shadow-indigo flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] hover:-translate-y-1 transition-all"
                    >
                        {loading ? <Loader2 className="animate-spin w-6 h-6" /> : "Publish Job"}
                    </button>
                    <p className="text-center text-[10px] text-slate-400 mt-5 uppercase tracking-widest font-black">
                        Only pay the worker when the <span className="text-indigo-400">physical handover</span> is complete.
                    </p>
                </div>
            </form>
        </div>
    );
}
