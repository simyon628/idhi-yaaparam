"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
export const dynamic = "force-dynamic";
import { db, auth, storage } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, getDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast } from "sonner";
import { Camera, ChevronLeft, Loader2, IndianRupee, MapPin, School, GraduationCap, Plus, X, Lightbulb, Calendar } from "lucide-react";
import { useCollege } from "@/contexts/CollegeContext";
import { DEPARTMENTS } from "@/lib/constants";
import { useCampusBlocks } from "@/lib/hooks/useCampusBlocks";

import { CATEGORIES as GRID_CATEGORIES } from "@/components/ui/CategoryGrid";
import { compressImageFile } from "@/lib/image/compressImage";

const ITEM_SUGGESTIONS = ["Casio fx991", "Drafter", "Mini Drafter", "Geometry Box", "Physics Lab Record", "Chemistry Lab Record", "Arduino Uno", "Multimeter"];
const CATEGORIES = GRID_CATEGORIES.map(c => c.name);

export default function NewRentalPage() {
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState("");
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [price, setPrice] = useState("");
    const [block, setBlock] = useState("");
    const [department, setDepartment] = useState(DEPARTMENTS[0]);
    const [image, setImage] = useState<File | null>(null);
    const [extraImages, setExtraImages] = useState<File[]>([]); // Multi-image
    const [preview, setPreview] = useState<string | null>(null);
    const [extraPreviews, setExtraPreviews] = useState<string[]>([]);
    const [userDept, setUserDept] = useState("");
    const [expiresInDays, setExpiresInDays] = useState(7); // Feature 2: Expiry
    const [suggestedPrice, setSuggestedPrice] = useState<number | null>(null); // Feature 9

    const router = useRouter();
    const { selectedCollege, isReady } = useCollege();
    const { formatting: dynamicBlocks, loading: blocksLoading } = useCampusBlocks(selectedCollege);

    // Auto-select first dynamic block once loaded
    useEffect(() => {
        if (dynamicBlocks.length > 0 && (!block || block === "Loading blocks...")) {
            setBlock(dynamicBlocks[0]);
        }
    }, [dynamicBlocks, block]);

    // Feature 9: Smart Pricing - fetch avg price for this category at this college
    useEffect(() => {
        if (!selectedCollege || !db || !category) return;
        const selectedCat = GRID_CATEGORIES.find(c => c.name === category);
        if (!selectedCat) return;
        import("firebase/firestore").then(({ collection, query, where, getDocs }) => {
            const q = query(
                collection(db as any, "rentals"),
                where("collegeId", "==", selectedCollege.id),
                where("categoryId", "==", selectedCat.id)
            );
            getDocs(q).then(snap => {
                if (snap.size < 3) { setSuggestedPrice(null); return; }
                const prices = snap.docs.map(d => d.data().pricePerHour || 0);
                const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
                setSuggestedPrice(avg);
            });
        });
    }, [category, selectedCollege]);

    // Fetch user profile settings if any
    useEffect(() => {
        const currentUser = auth?.currentUser;
        if (!currentUser || !db) return;
        getDoc(doc(db, "users", currentUser.uid)).then(docSnap => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.department) setUserDept(data.department);
                if (data.department && DEPARTMENTS.includes(data.department)) {
                    setDepartment(data.department);
                }
            }
        });
    }, []);

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const previewReader = new FileReader();
                previewReader.onloadend = () => setPreview(previewReader.result as string);
                previewReader.readAsDataURL(file);
                const compressedBlob = await compressImageFile(file, { maxWidth: 1280, quality: 0.7 });
                const compressedFile = new File([compressedBlob], `compressed_${file.name}.jpg`, { type: "image/jpeg" });
                setImage(compressedFile);
            } catch (error) {
                console.error("Compression failed", error);
                toast.error("Failed to process image.");
            }
        }
    };

    // Feature 7: Extra images handler
    const handleExtraImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        for (const file of files) {
            if (extraImages.length >= 2) break;
            try {
                const blob = await compressImageFile(file, { maxWidth: 1280, quality: 0.7 });
                const compressed = new File([blob], `extra_${file.name}.jpg`, { type: "image/jpeg" });
                setExtraImages(prev => [...prev, compressed].slice(0, 2));
                const reader = new FileReader();
                reader.onloadend = () => setExtraPreviews(prev => [...prev, reader.result as string].slice(0, 2));
                reader.readAsDataURL(file);
            } catch { /* ignore */ }
        }
    };

    const removeExtraImage = (idx: number) => {
        setExtraImages(prev => prev.filter((_, i) => i !== idx));
        setExtraPreviews(prev => prev.filter((_, i) => i !== idx));
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

            const iconMap: Record<string, string> = { "Calculator": "🧮", "Drafter": "📐", "Geometry Set": "📏", "Books/Notes": "📓", "Lab Coat": "🥼", "Others": "📦" };
            const selectedCat = GRID_CATEGORIES.find(c => c.name === category);

            // Upload extra images
            const extraPhotoUrls: string[] = [];
            for (const extraImg of extraImages) {
                const extraRef = ref(storage as any, `rental_photos/${Date.now()}_extra_${userId}`);
                const extraUpload = await uploadBytes(extraRef, extraImg);
                const extraUrl = await getDownloadURL(extraUpload.ref);
                extraPhotoUrls.push(extraUrl);
            }

            // Feature 2: Compute expiry timestamp
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + expiresInDays);

            await addDoc(collection(db, "rentals"), {
                ownerId: userId,
                itemName: name,
                pricePerHour: parseInt(price),
                block,
                college: selectedCollege.name,
                collegeId: selectedCollege.id,
                department,
                categoryId: selectedCat?.id || "others",
                icon: iconMap[category] || "📦",
                photoUrl,
                extraPhotoUrls,
                status: "available",
                renterId: null,
                createdAt: serverTimestamp(),
                expiresAt: expiresAt.toISOString(),
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
            <div className="flex-1 flex flex-col items-center justify-center min-h-screen text-center px-6 bg-slate-50">
                <span className="text-5xl text-indigo-200 mb-6 drop-shadow-sm">🎓</span>
                <h2 className="text-2xl font-black text-slate-800 mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>Select a Campus</h2>
                <p className="text-sm font-semibold text-slate-500 mb-8 max-w-[280px]">You must select a college from the home page top bar to list an item.</p>
                <button onClick={() => router.push("/home")} className="gradient-indigo text-white px-8 py-3.5 rounded-2xl font-bold shadow-indigo hover:-translate-y-0.5 transition-transform active:scale-95">Go to Home</button>
            </div>
        )
    }

    return (
        <div className="flex-1 flex flex-col min-h-screen bg-slate-50 relative">
            {/* Ambient Background Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-200/40 blob rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{ animationDelay: "0s" }} />
            <div className="absolute top-[20%] right-[-10%] w-[40%] h-[60%] bg-pink-200/30 blob rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{ animationDelay: "2s" }} />

            {/* Header */}
            <header className="px-5 pt-12 pb-6 flex items-center gap-4 border-b border-indigo-100 bg-white/60 backdrop-blur-md sticky top-0 z-20">
                <button
                    onClick={() => router.back()}
                    className="p-2.5 bg-white border border-indigo-100 rounded-xl active:scale-95 transition-all text-slate-500 hover:text-indigo-600 shadow-sm"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-slate-800 leading-none" style={{ fontFamily: "Outfit, sans-serif" }}>Rent Your Item</h1>
                    <p className="text-[11px] font-black text-indigo-500 uppercase tracking-widest mt-1.5">Earn by lending</p>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="flex-1 px-5 space-y-7 py-8 pb-16 relative z-10 max-w-md mx-auto w-full">

                {/* College Read-only */}
                <div className="flex items-center gap-4 p-5 bg-white/70 backdrop-blur-xl rounded-3xl border border-indigo-50 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 shadow-inner">
                        <School className="w-6 h-6 text-indigo-500" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Listing in Campus</p>
                        <p className="text-[15px] font-bold text-indigo-700 mt-0.5">{selectedCollege?.name}</p>
                    </div>
                </div>

                {/* Photo Upload */}
                <div className="space-y-2.5">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">Item Photo *</label>
                    <div
                        onClick={() => document.getElementById("photo-input")?.click()}
                        className="aspect-[4/3] rounded-[2rem] border-2 border-dashed border-indigo-200 bg-white/50 flex flex-col items-center justify-center relative overflow-hidden group active:scale-[0.99] transition-all cursor-pointer hover:border-indigo-400 hover:bg-slate-50 shadow-inner"
                    >
                        {preview ? (
                            <>
                                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                    <div className="p-4 bg-white rounded-full shadow-lg">
                                        <Camera className="w-8 h-8 text-indigo-600" />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-4 p-6 text-center">
                                <div className="p-4 bg-indigo-50 rounded-2xl group-hover:bg-indigo-100 group-hover:scale-110 transition-all text-indigo-400">
                                    <Camera className="w-8 h-8 group-hover:text-indigo-600 transition-colors" />
                                </div>
                                <div>
                                    <p className="text-[15px] font-bold text-slate-700">Tap to upload a clear photo</p>
                                    <p className="text-xs font-semibold text-slate-400 mt-1">Show any scratches or defects</p>
                                </div>
                            </div>
                        )}
                        <input id="photo-input" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    </div>
                </div>

                {/* Item Name */}
                <div className="space-y-2.5">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 flex justify-between pl-1">
                        <span>Item Name *</span>
                    </label>
                    <input
                        type="text"
                        placeholder="e.g. Casio fx-991EX"
                        list="item-suggestions"
                        className="w-full bg-white/70 backdrop-blur-md border border-indigo-50 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 rounded-2xl h-14 px-5 text-slate-800 placeholder-slate-400 font-bold outline-none transition-all shadow-inner"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <datalist id="item-suggestions">
                        {ITEM_SUGGESTIONS.map(s => <option key={s} value={s} />)}
                    </datalist>
                </div>

                {/* Category & Price Row */}
                <div className="flex gap-4">
                    <div className="space-y-2.5 flex-1">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">Category *</label>
                        <select
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                            className="w-full bg-white/70 backdrop-blur-md border border-indigo-50 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 rounded-2xl h-14 px-4 text-slate-700 font-bold outline-none appearance-none shadow-inner transition-all"
                        >
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    {/* Price + Smart Pricing Suggestion */}
                    <div className="space-y-2.5 w-1/2">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">Price / hr *</label>
                        <div className="flex items-center gap-2 bg-white/70 backdrop-blur-md rounded-2xl border border-indigo-50 focus-within:border-indigo-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-100 h-14 px-4 shadow-inner transition-all">
                            <IndianRupee className="w-5 h-5 text-indigo-500 shrink-0" />
                            <input
                                type="number"
                                placeholder="20"
                                min="0"
                                className="w-full bg-transparent text-slate-800 placeholder-slate-400 font-black text-lg outline-none"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                            />
                        </div>
                        {suggestedPrice && (
                            <button
                                type="button"
                                onClick={() => setPrice(String(suggestedPrice))}
                                className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-500 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-full"
                            >
                                <Lightbulb className="w-3 h-3" /> Avg ₹{suggestedPrice}/hr at your campus — tap to use
                            </button>
                        )}
                    </div>
                </div>

                <div className="space-y-2.5 flex-1">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5 pl-1">
                        <GraduationCap className="w-3.5 h-3.5" /> Department
                    </label>
                    <select
                        value={department}
                        onChange={e => setDepartment(e.target.value)}
                        className="w-full bg-white/70 backdrop-blur-md border border-indigo-50 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 rounded-2xl h-14 px-4 text-slate-700 font-bold outline-none appearance-none shadow-inner transition-all"
                    >
                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>

                <div className="space-y-2.5 flex-1">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5 pl-1">
                        <MapPin className="w-3.5 h-3.5" /> Block
                    </label>
                    <select
                        value={block}
                        onChange={e => setBlock(e.target.value)}
                        disabled={blocksLoading}
                        className="w-full bg-white/70 backdrop-blur-md border border-indigo-50 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 rounded-2xl h-14 px-4 text-slate-700 font-bold outline-none appearance-none shadow-inner transition-all disabled:opacity-60"
                    >
                        {dynamicBlocks.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                </div>

                {/* Feature 2: Listing Expiry */}
                <div className="space-y-2.5">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5 pl-1">
                        <Calendar className="w-3.5 h-3.5" /> Listing Expires In
                    </label>
                    <div className="flex gap-2">
                        {[3, 7, 14, 30].map(days => (
                            <button
                                type="button"
                                key={days}
                                onClick={() => setExpiresInDays(days)}
                                className={`flex-1 py-3 rounded-xl border text-xs font-bold transition-all ${expiresInDays === days ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200"}`}
                            >
                                {days}d
                            </button>
                        ))}
                    </div>
                </div>

                {/* Feature 7: Extra Photos */}
                {preview && extraPreviews.length < 2 && (
                    <div className="space-y-2.5">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">Extra Photos (up to 2 more)</label>
                        <div className="flex gap-2">
                            {extraPreviews.map((ep, i) => (
                                <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200">
                                    <img src={ep} alt={`extra ${i}`} className="w-full h-full object-cover" />
                                    <button type="button" onClick={() => removeExtraImage(i)} className="absolute top-1 right-1 bg-black/50 rounded-full p-0.5">
                                        <X className="w-3 h-3 text-white" />
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => document.getElementById("extra-photo-input")?.click()}
                                className="w-20 h-20 rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50 flex items-center justify-center text-indigo-400"
                            >
                                <Plus className="w-6 h-6" />
                            </button>
                            <input id="extra-photo-input" type="file" accept="image/*" multiple className="hidden" onChange={handleExtraImageChange} />
                        </div>
                    </div>
                )}

                {/* Submit */}
                <div className="pt-8">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-16 rounded-2xl gradient-indigo text-white font-black text-base shadow-indigo flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] hover:-translate-y-1 transition-all"
                    >
                        {loading ? <Loader2 className="animate-spin w-6 h-6" /> : "Publish Listing"}
                    </button>
                    <p className="text-center text-[10px] text-slate-400 mt-5 uppercase tracking-widest font-black">
                        By listing, you agree to the <span className="text-indigo-400">2-Strike Campus Policy</span>
                    </p>
                </div>
            </form>
        </div>
    );
}
