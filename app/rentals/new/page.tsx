"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
export const dynamic = "force-dynamic";
import { db, auth, storage } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, getDoc, doc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast } from "sonner";
import { Camera, ChevronLeft, Loader2, IndianRupee, MapPin, School, GraduationCap, Plus, X, Lightbulb, Calendar } from "lucide-react";
import { useCollege } from "@/contexts/CollegeContext";
import { DEPARTMENTS } from "@/lib/constants";
import { useCampusBlocks } from "@/lib/hooks/useCampusBlocks";

import { CATEGORIES as GRID_CATEGORIES } from "@/components/ui/CategoryGrid";
import { compressImageFile } from "@/lib/image/compressImage";
import { useListingMode } from "@/lib/hooks/useListingMode";

const ITEM_SUGGESTIONS = ["Casio fx991", "Drafter", "Mini Drafter", "Geometry Box", "Physics Lab Record", "Chemistry Lab Record", "Arduino Uno", "Multimeter"];
const CATEGORIES = GRID_CATEGORIES.map(c => c.name);

function NewRentalForm() {
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState("");
    const searchParams = useSearchParams();
    const initialCategory = searchParams.get("category") || "";
    const typeFromUrl = searchParams.get("type") as "rent" | "sell" | null;
    const { listingMode } = useListingMode();
    const activeType: "rent" | "sell" = typeFromUrl === "sell" || listingMode === "sell" ? "sell" : "rent";
    const formConfig = activeType === "sell"
        ? { title: "Sell Your Item",  subtitle: "List it for sale",   priceLabel: "Selling Price (₹)", submitLabel: "List for Sale" }
        : { title: "Rent Your Item",  subtitle: "Earn by lending",    priceLabel: "Price per day (₹)",  submitLabel: "List for Rent" };
    const [category, setCategory] = useState(initialCategory);
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
    const [condition, setCondition] = useState<"Excellent" | "Good" | "Fair">("Good"); // Item condition
    const [currentUserId, setCurrentUserId] = useState<string | null>(null); // Async auth
    const [authChecked, setAuthChecked] = useState(false);

    // Resolve auth user asynchronously (fixes publish bug)
    useEffect(() => {
        if (!auth) { setAuthChecked(true); return; }
        const unsub = onAuthStateChanged(auth as any, (user) => {
            setCurrentUserId(user?.uid ?? null);
            setAuthChecked(true);
        });
        return () => unsub();
    }, []);

    const router = useRouter();
    const { selectedCollege, isReady } = useCollege();
    const { formatting: dynamicBlocks, loading: blocksLoading } = useCampusBlocks(selectedCollege);

    useEffect(() => {
        if (initialCategory) {
            // Find display name for the category ID
            const cat = GRID_CATEGORIES.find(c => c.id === initialCategory || c.name === initialCategory);
            if (cat) {
                setCategory(cat.name);
                // Also suggest item name based on category
                if (cat.id === "drafter") setName("Drafter");
                if (cat.id === "calculator") setName("Casio fx-991");
            }
        }
    }, [initialCategory]);

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
        if (!name || !price || !image || !selectedCollege || !category) {
            toast.error("Fill all fields, select a category, and add a photo");
            return;
        }
        if (!authChecked) {
            toast.error("Still checking login status, please wait...");
            return;
        }
        if (!currentUserId) {
            toast.error("You must be signed in to list an item.");
            router.push("/login");
            return;
        }
        setLoading(true);
        try {
            const userId = currentUserId;
            if (!storage || !db) throw new Error("Firebase not initialized");

            // Verify the user has a registered profile (not just anonymous)
            const userDoc = await getDoc(doc(db, "users", userId));
            if (!userDoc.exists()) {
                toast.error("Please complete registration before listing items.");
                router.push("/login");
                setLoading(false);
                return;
            }

            const iconMap: Record<string, string> = { "Calculator": "🧮", "Drafter": "📐", "Geometry Set": "📏", "Books/Notes": "📓", "Lab Coat": "🥼", "Electronic Gadgets": "💻", "Others": "📦" };
            const selectedCat = GRID_CATEGORIES.find(c => c.name === category);

            // Feature 2: Compute expiry timestamp
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + expiresInDays);

            // ⚡ Step 1: Convert compressed image to Base64 data URL
            // This runs instantly (no network needed) — image visible from the start
            const toBase64 = (file: File): Promise<string> => new Promise((res, rej) => {
                const reader = new FileReader();
                reader.onloadend = () => res(reader.result as string);
                reader.onerror = rej;
                reader.readAsDataURL(file);
            });
            const photoDataUrl = await toBase64(image); // ~50-100ms

            // ⚡ Step 2: Create Firestore doc WITH image data — item is fully visible instantly
            const docRef = await addDoc(collection(db, "rentals"), {
                ownerId: userId,
                itemName: name,
                pricePerHour: parseInt(price),
                block,
                college: selectedCollege.name,
                collegeId: selectedCollege.id,
                department,
                categoryId: selectedCat?.id || "others",
                listingType: activeType,
                icon: iconMap[category] || "📦",
                photoUrl: photoDataUrl,   // base64 — visible immediately, no storage needed
                extraPhotoUrls: [],
                condition,
                status: "available",
                renterId: null,
                createdAt: serverTimestamp(),
                expiresAt: expiresAt.toISOString(),
            });

            // ⚡ Step 3: Navigate immediately — item is LIVE with image
            toast.success("🎉 Item listed! Visible now.", { duration: 4000 });
            setLoading(false);
            router.push("/home");

            // 🔄 Step 4: Background — upgrade from base64 to Firebase Storage URL
            // (reduces Firestore doc size from ~400KB to a small URL string)
            // This is optional — item works perfectly even if this fails
            if (storage) {
                (async () => {
                    try {
                        const imageRef = ref(storage!, `rentals/${docRef.id}_${userId}.jpg`);
                        const uploaded = await uploadBytes(imageRef, image);
                        const storageUrl = await getDownloadURL(uploaded.ref);
                        const { updateDoc: updDoc, doc: fDoc } = await import("firebase/firestore");
                        await updDoc(fDoc(db!, "rentals", docRef.id), { photoUrl: storageUrl });

                        // Extra images
                        const extraUrls: string[] = [];
                        for (const extraImg of extraImages) {
                            const eRef = ref(storage!, `rental_photos/${docRef.id}_extra${extraUrls.length}_${userId}.jpg`);
                            const eUp = await uploadBytes(eRef, extraImg);
                            extraUrls.push(await getDownloadURL(eUp.ref));
                        }
                        if (extraUrls.length > 0) {
                            const { updateDoc: upd, doc: fd } = await import("firebase/firestore");
                            await upd(fd(db!, "rentals", docRef.id), { extraPhotoUrls: extraUrls });
                        }
                    } catch (e) {
                        console.warn("Storage upgrade failed (item is still listed with base64 image):", e);
                    }
                })();
            }

        } catch (error: any) {
            console.error("Publish error:", error);
            const msg = error?.message || "Unknown error";
            toast.error(`Failed to list item: ${msg}`);
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
                    <h1 className="text-2xl font-black text-slate-800 leading-none" style={{ fontFamily: "Outfit, sans-serif" }}>{formConfig.title}</h1>
                    <p className="text-[11px] font-black text-indigo-500 uppercase tracking-widest mt-1.5">{formConfig.subtitle}</p>
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
                            <option value="" disabled>Select Category</option>
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    {/* Price + Smart Pricing Suggestion */}
                    <div className="space-y-2.5 w-1/2">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">{formConfig.priceLabel}</label>
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

                {/* Item Condition Chips */}
                <div className="space-y-2.5">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">Item Condition *</label>
                    <div className="flex gap-2">
                        {(["Excellent", "Good", "Fair"] as const).map((c) => (
                            <button
                                key={c}
                                type="button"
                                onClick={() => setCondition(c)}
                                className={`flex-1 py-3 rounded-2xl text-sm font-black border transition-all active:scale-95 ${
                                    condition === c
                                        ? c === "Excellent" ? "bg-emerald-500 text-white border-emerald-500 shadow-md" :
                                          c === "Good" ? "bg-indigo-500 text-white border-indigo-500 shadow-md" :
                                          "bg-amber-500 text-white border-amber-500 shadow-md"
                                        : "bg-white/70 text-slate-500 border-slate-200 hover:border-slate-300"
                                }`}
                            >
                                {c === "Excellent" ? "✨ Excellent" : c === "Good" ? "👍 Good" : "⚠️ Fair"}
                            </button>
                        ))}
                    </div>
                    <p className="text-[10px] text-slate-400 font-semibold pl-1">
                        {condition === "Excellent" ? "Like new — no scratches or defects" :
                         condition === "Good" ? "Normal wear — works perfectly" :
                         "Visible marks — still fully functional"}
                    </p>
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

                <div className="space-y-2.5 flex-1 relative">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5 pl-1">
                        <MapPin className="w-3.5 h-3.5" /> Block / Location *
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="e.g. Main Block, Library..."
                            value={block}
                            onChange={e => setBlock(e.target.value)}
                            className="w-full bg-white/70 backdrop-blur-md border border-indigo-50 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 rounded-2xl h-14 px-5 text-slate-800 placeholder-slate-400 font-bold outline-none shadow-inner transition-all"
                        />
                        {block && dynamicBlocks.some(b => b.toLowerCase().includes(block.toLowerCase()) && b.toLowerCase() !== block.toLowerCase()) && (
                            <div className="absolute top-full left-0 right-0 mt-2 z-30 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-1">
                                {dynamicBlocks
                                    .filter(b => b.toLowerCase().includes(block.toLowerCase()))
                                    .slice(0, 4)
                                    .map(b => (
                                        <button
                                            key={b}
                                            type="button"
                                            onClick={() => setBlock(b)}
                                            className="w-full px-5 py-3 text-left hover:bg-slate-50 font-bold text-slate-700 border-b border-slate-50 last:border-none text-sm"
                                        >
                                            {b}
                                        </button>
                                    ))}
                            </div>
                        )}
                    </div>
                    <p className="text-[9px] text-slate-400 font-bold pl-1 uppercase tracking-widest mt-1">
                        You can type a specific location or pick from suggestions
                    </p>
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
                        {loading ? <Loader2 className="animate-spin w-6 h-6" /> : formConfig.submitLabel}
                    </button>
                    <p className="text-center text-[10px] text-slate-400 mt-5 uppercase tracking-widest font-black">
                        By listing, you agree to the <span className="text-indigo-400">2-Strike Campus Policy</span>
                    </p>
                </div>
            </form>
        </div>
    );
}

export default function NewRentalPage() {
    return (
        <Suspense fallback={<div className="flex-1 flex items-center justify-center min-h-screen bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-indigo-400" /></div>}>
            <NewRentalForm />
        </Suspense>
    );
}
