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

import { CATEGORIES as GRID_CATEGORIES } from "@/components/ui/CategoryGrid";
import { compressImageFile } from "@/lib/image/compressImage";
import { useListingMode } from "@/lib/hooks/useListingMode";

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
        : { title: "Rent Your Item",  subtitle: "Earn by lending",    priceLabel: "Price per hour (₹)",  submitLabel: "List for Rent" };
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

    // Bug 2 fix: Robust category matching (by id, then by name, then by id-without-hyphens)
    useEffect(() => {
        if (!initialCategory) return;

        let cat = GRID_CATEGORIES.find(c => c.id === initialCategory);

        if (!cat) {
            cat = GRID_CATEGORIES.find(
                c => c.name.toLowerCase() === initialCategory.toLowerCase()
            );
        }

        if (!cat) {
            cat = GRID_CATEGORIES.find(
                c => c.id.replace(/-/g, '') === initialCategory.replace(/-/g, '')
            );
        }

        if (cat) {
            setCategory(cat.name);
            // NOTE: Do NOT auto-fill item name — user must type it (Bug 3 fix)
        }
    }, [initialCategory]);

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

    const validateImage = (file: File, categoryId: string) => {
        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file only (JPG, PNG)');
            return false;
        }
        
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image too large. Please upload under 5MB');
            return false;
        }

        const categoryNames: Record<string, string> = {
            'cat-calculator': 'Calculator',
            'cat-drafter': 'Drafter / Drawing Board',
            'cat-labcoat': 'Lab Coat',
            'cat-geometry': 'Geometry Set',
            'cat-books': 'Books / Notes',
            'cat-electronics': 'Electronics',
            'cat-tools': 'Tools',
        };
        const catName = categoryNames[categoryId] ?? category ?? 'item';
        
        toast.success(`Photo added for: ${catName}`);
        return true;
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Compute category ID for validation
            const selectedCat = GRID_CATEGORIES.find(c => c.name === category);
            const catId = selectedCat?.id || "";

            if (!validateImage(file, catId)) return;

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

            // ⚡ Step 1: Convert compressed image to Base64 data URL (~50-100ms, no network)
            const toBase64 = (file: File): Promise<string> => new Promise((res, rej) => {
                const reader = new FileReader();
                reader.onloadend = () => res(reader.result as string);
                reader.onerror = rej;
                reader.readAsDataURL(file);
            });
            const photoDataUrl = await toBase64(image);

            const iconMap: Record<string, string> = { "Calculator": "🧮", "Drafter": "📐", "Geometry Set": "📏", "Books/Notes": "📓", "Lab Coat": "🥼", "Electronic Gadgets": "💻", "Others": "📦" };
            const selectedCat = GRID_CATEGORIES.find(c => c.name === category);
            const catId = selectedCat?.id || "others";
            const collegeId = selectedCollege.id;

            // Compute expiry timestamp
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + expiresInDays);

            // ⚡ Save to Firestore — onSnapshot listener auto-updates the category page in real-time
            await addDoc(collection(db, "rentals"), {
                ownerId: userId,
                itemName: name,
                pricePerHour: parseInt(price),
                block,
                college: selectedCollege.name,
                collegeId,
                department,
                categoryId: catId,
                listingType: activeType,
                icon: iconMap[category] || "📦",
                photoUrl: photoDataUrl,
                extraPhotoUrls: [],
                condition,
                status: "available",
                renterId: null,
                createdAt: serverTimestamp(),
                expiresAt: expiresAt.toISOString(),
            });

            // onSnapshot in useAllItems auto-pushes the new item to all listeners — no manual cache bust needed.
            toast.success("🎉 Item listed! Visible now.", { duration: 4000 });
            setLoading(false);
            router.push("/rentals");


            // 🔄 Step 4: Background Storage upload — DISABLED
            // Firebase Storage CORS is not configured for Vercel domain.
            // Items display perfectly using the base64 image saved in Step 2.
            // To re-enable: configure CORS in Google Cloud Console for the storage bucket,
            // then uncomment this block.
            // if (storage) { ... }

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

                {/* 1. Add Photo (required) */}
                <div className="space-y-2.5">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1 flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5" /> Add Photo *
                    </label>
                    <div 
                        onClick={() => { if (!preview) document.getElementById("photo-upload")?.click() }}
                        className={`relative w-full aspect-video rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${preview ? "border-transparent bg-transparent" : "border-indigo-100 bg-white/70 hover:bg-white hover:border-indigo-300 shadow-inner cursor-pointer overflow-hidden"}`}
                    >
                        {preview ? (
                            <div style={{position:'relative',marginTop:8, width: '100%'}}>
                                <p style={{
                                    fontSize:11,
                                    color:'#9CA3AF',
                                    marginBottom:4
                                }}>
                                    Photo for: {category || 'item'}
                                </p>
                                <img 
                                    src={preview}
                                    style={{
                                        width:'100%',
                                        aspectRatio:'4/3',
                                        objectFit:'cover',
                                        borderRadius:12
                                    }}
                                    alt="Preview"
                                />
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setPreview(null);
                                        setImage(null);
                                    }}
                                    style={{
                                        position:'absolute',
                                        top:24, right:8,
                                        background:'rgba(0,0,0,0.5)',
                                        color:'white',
                                        border:'none',
                                        borderRadius:'50%',
                                        width:24, height:24,
                                        cursor:'pointer',
                                        fontSize:14,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center shadow-inner">
                                    <Camera className="w-8 h-8 text-indigo-500" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-bold text-slate-700">Tap to upload or take a photo</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Gallery or Camera</p>
                                </div>
                            </div>
                        )}
                        <input 
                            id="photo-upload" 
                            type="file" 
                            accept="image/*" 
                            capture="environment"
                            className="hidden" 
                            onChange={handleImageChange} 
                        />
                    </div>
                </div>

                {/* 2. Category (pre-filled) */}
                <div className="space-y-2.5">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">Category *</label>
                    <div className="relative">
                        <select
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                            className="w-full bg-white/70 backdrop-blur-md border border-indigo-50 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 rounded-2xl h-14 px-4 text-slate-700 font-bold outline-none appearance-none shadow-inner transition-all"
                        >
                            <option value="" disabled>Select Category</option>
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <Plus className="w-4 h-4 rotate-45" />
                        </div>
                    </div>
                </div>

                {/* 3. Item Name */}
                <div className="space-y-2.5">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">
                        What are you listing? *
                    </label>
                    <input
                        type="text"
                        placeholder="Enter item name"
                        className="w-full bg-white/70 backdrop-blur-md border border-indigo-50 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 rounded-2xl h-14 px-5 text-slate-800 placeholder-slate-400 font-bold outline-none transition-all shadow-inner"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>

                {/* 4. Price per hour */}
                <div className="space-y-2.5">
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
                            <Lightbulb className="w-3 h-3" /> Price Tip: Avg ₹{suggestedPrice} per hour at campus — use
                        </button>
                    )}
                </div>

                {/* 5. Condition */}
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
                </div>

                {/* 6. Your Department */}
                <div className="space-y-2.5 flex-1">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5 pl-1">
                        <GraduationCap className="w-3.5 h-3.5" /> Your Department *
                    </label>
                    <select
                        value={department}
                        onChange={e => setDepartment(e.target.value)}
                        className="w-full bg-white/70 backdrop-blur-md border border-indigo-50 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 rounded-2xl h-14 px-4 text-slate-700 font-bold outline-none appearance-none shadow-inner transition-all"
                    >
                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>

                {/* 7. Block/Location */}
                <div className="space-y-2.5 flex-1">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5 pl-1">
                        <MapPin className="w-3.5 h-3.5" /> Block / Location *
                    </label>
                    <input
                        type="text"
                        placeholder="Enter your block"
                        value={block}
                        onChange={e => setBlock(e.target.value)}
                        className="w-full bg-white/70 backdrop-blur-md border border-indigo-50 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 rounded-2xl h-14 px-5 text-slate-800 placeholder-slate-400 font-bold outline-none shadow-inner transition-all"
                    />
                </div>

                {/* 8. Listing Expires In */}
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

                {/* Extra Photos (remaining) */}
                {preview && extraPreviews.length < 2 && (
                    <div className="space-y-2.5">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">Extra Photos (Optional, up to 2)</label>
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
