"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
export const dynamic = "force-dynamic";
import { db, auth, storage } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, getDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast } from "sonner";
import { Camera, ChevronLeft, Loader2, IndianRupee, MapPin, School, GraduationCap } from "lucide-react";
import { useCollege } from "@/contexts/CollegeContext";
import { BLOCKS, DEPARTMENTS } from "@/lib/constants";

const ITEM_SUGGESTIONS = ["Casio fx991", "Drafter", "Mini Drafter", "Geometry Box", "Physics Lab Record", "Chemistry Lab Record", "Arduino Uno", "Multimeter"];
const CATEGORIES = ["Calculator", "Drafter", "Stationery", "Books/Manuals", "Electronics", "Other"];

export default function NewRentalPage() {
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState("");
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [price, setPrice] = useState("");
    const [block, setBlock] = useState(BLOCKS[0]);
    const [department, setDepartment] = useState(DEPARTMENTS[0]);
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [userDept, setUserDept] = useState("");

    const router = useRouter();
    const { selectedCollege, isReady } = useCollege();

    // Fetch user profile settings if any
    useEffect(() => {
        if (!auth.currentUser || !db) return;
        getDoc(doc(db, "users", auth.currentUser.uid)).then(docSnap => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.department) setUserDept(data.department);
                if (data.department && DEPARTMENTS.includes(data.department)) {
                    setDepartment(data.department);
                }
            }
        });
    }, []);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !price || !image || !selectedCollege) {
            toast.error("Fill all fields and add a photo");
            return;
        }
        setLoading(true);
        try {
            const userId = auth?.currentUser?.uid;
            if (!userId || !storage || !db) throw new Error("Init error");
            const storageRef = ref(storage, `rentals/${Date.now()}_${userId}.jpg`);
            await uploadBytes(storageRef, image);
            const photoUrl = await getDownloadURL(storageRef);

            // basic icon mapper
            const iconMap: Record<string, string> = { "Calculator": "🧮", "Drafter": "📐", "Stationery": "📏", "Books/Manuals": "📓", "Electronics": "⚡", "Other": "📦" };

            await addDoc(collection(db, "rentals"), {
                ownerId: userId,
                itemName: name,
                pricePerHour: parseInt(price),
                block,
                college: selectedCollege,
                department,
                icon: iconMap[category] || "📦",
                photoUrl,
                status: "available",
                renterId: null,
                createdAt: serverTimestamp(),
            });
            toast.success("Item listed successfully! 🎉");
            router.push("/home");
        } catch (error) {
            toast.error("Failed to list item. Try again.");
        } finally {
            setLoading(false);
        }
    };

    if (isReady && !selectedCollege) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-screen text-center px-6">
                <span className="text-4xl text-slate-500 mb-4">🎓</span>
                <h2 className="text-xl font-bold text-white mb-2">Select a College First</h2>
                <p className="text-sm text-slate-400 mb-6">You must select a college from the home page top bar to list an item.</p>
                <button onClick={() => router.push("/home")} className="bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold">Go to Home</button>
            </div>
        )
    }

    return (
        <div className="flex-1 flex flex-col min-h-screen">
            {/* Header */}
            <header className="px-5 pt-12 pb-6 flex items-center gap-4 border-b border-slate-800">
                <button
                    onClick={() => router.back()}
                    className="p-2.5 glass rounded-xl border border-slate-700/50 active:scale-95 transition-all text-slate-400 hover:text-white"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-xl font-black text-white leading-none" style={{ fontFamily: "Outfit, sans-serif" }}>Rent Your Item</h1>
                    <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest mt-1">Earn by lending</p>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="flex-1 px-5 space-y-7 py-6 pb-16">

                {/* College Read-only */}
                <div className="flex items-center gap-3 p-4 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                        <School className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Listing in College</p>
                        <p className="text-sm font-bold text-slate-200 mt-0.5">{selectedCollege}</p>
                    </div>
                </div>

                {/* Photo Upload */}
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Item Photo *</label>
                    <div
                        onClick={() => document.getElementById("photo-input")?.click()}
                        className="aspect-video rounded-3xl border-2 border-dashed border-slate-700 bg-[hsl(217,32%,14%)] flex flex-col items-center justify-center relative overflow-hidden group active:scale-[0.99] transition-all cursor-pointer hover:border-indigo-500/50 hover:bg-slate-800 shadow-inner"
                    >
                        {preview ? (
                            <>
                                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                    <Camera className="w-10 h-10 text-white" />
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-3 p-6 text-center">
                                <div className="p-4 bg-slate-800 rounded-2xl group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors text-slate-500">
                                    <Camera className="w-8 h-8" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-300">Tap to upload a clear photo</p>
                                    <p className="text-xs text-slate-500 mt-0.5">Show any scratches or defects</p>
                                </div>
                            </div>
                        )}
                        <input id="photo-input" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    </div>
                </div>

                {/* Item Name */}
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex justify-between">
                        <span>Item Name *</span>
                    </label>
                    <input
                        type="text"
                        placeholder="e.g. Casio fx-991EX"
                        list="item-suggestions"
                        className="w-full bg-[hsl(217,32%,16%)] border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 rounded-xl h-14 px-4 text-white placeholder-slate-600 font-medium outline-none transition-all"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <datalist id="item-suggestions">
                        {ITEM_SUGGESTIONS.map(s => <option key={s} value={s} />)}
                    </datalist>
                </div>

                {/* Category & Price Row */}
                <div className="flex gap-4">
                    <div className="space-y-2 flex-1">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Category *</label>
                        <select
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                            className="w-full bg-[hsl(217,32%,16%)] border border-slate-700 focus:border-indigo-500 rounded-xl h-14 px-4 text-white font-medium outline-none appearance-none"
                        >
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2 w-1/2">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Price / hr *</label>
                        <div className="flex items-center gap-2 bg-[hsl(217,32%,16%)] rounded-xl border border-slate-700 focus-within:border-indigo-500 h-14 px-4">
                            <IndianRupee className="w-4 h-4 text-amber-500 shrink-0" />
                            <input
                                type="number"
                                placeholder="20"
                                min="0"
                                className="w-full bg-transparent text-white placeholder-slate-600 font-bold outline-none"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Block & Department Row */}
                <div className="flex gap-4">
                    <div className="space-y-2 flex-1">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                            <GraduationCap className="w-3.5 h-3.5" /> Department
                        </label>
                        <select
                            value={department}
                            onChange={e => setDepartment(e.target.value)}
                            className="w-full bg-[hsl(217,32%,16%)] border border-slate-700 focus:border-indigo-500 rounded-xl h-14 px-4 text-white font-medium outline-none appearance-none"
                        >
                            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2 flex-1">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" /> Block
                        </label>
                        <select
                            value={block}
                            onChange={e => setBlock(e.target.value)}
                            className="w-full bg-[hsl(217,32%,16%)] border border-slate-700 focus:border-indigo-500 rounded-xl h-14 px-4 text-white font-medium outline-none appearance-none"
                        >
                            {BLOCKS.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>
                </div>

                {/* Submit */}
                <div className="pt-6">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-14 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-black text-base shadow-indigo shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
                    >
                        {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Publish Listing"}
                    </button>
                    <p className="text-center text-[10px] text-slate-500 mt-4 uppercase tracking-wider font-bold">
                        By listing, you agree to the 2-Strike Campus Policy
                    </p>
                </div>
            </form>
        </div>
    );
}
