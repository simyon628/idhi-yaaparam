"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
export const dynamic = "force-dynamic";
import { db, auth, storage } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "sonner";
import {
    ChevronLeft, Loader2, Camera, IndianRupee, MapPin,
    GraduationCap, Calendar, Save, AlertTriangle
} from "lucide-react";
import { DEPARTMENTS } from "@/lib/constants";
import { useCampusBlocks } from "@/lib/hooks/useCampusBlocks";
import { useCollege } from "@/contexts/CollegeContext";
import { CATEGORIES as GRID_CATEGORIES } from "@/components/ui/CategoryGrid";
import { compressImageFile } from "@/lib/image/compressImage";

const CATEGORIES = GRID_CATEGORIES.map(c => c.name);

export default function EditListingPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { selectedCollege } = useCollege();
    const { formatting: dynamicBlocks } = useCampusBlocks(selectedCollege);

    // Auth
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [authChecked, setAuthChecked] = useState(false);

    // Page state
    const [fetchLoading, setFetchLoading] = useState(true);
    const [saveLoading, setSaveLoading] = useState(false);
    const [notFound, setNotFound] = useState(false);
    const [notOwner, setNotOwner] = useState(false);

    // Form fields — pre-filled from Firestore
    const [name, setName] = useState("");
    const [category, setCategory] = useState("");
    const [price, setPrice] = useState("");
    const [block, setBlock] = useState("");
    const [department, setDepartment] = useState(DEPARTMENTS[0]);
    const [condition, setCondition] = useState<"Excellent" | "Good" | "Fair">("Good");
    const [expiresInDays, setExpiresInDays] = useState(7);
    const [listingType, setListingType] = useState<"rent" | "sell">("rent");

    // Photo
    const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);
    const [newImage, setNewImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    // Resolve auth
    useEffect(() => {
        if (!auth) { setAuthChecked(true); return; }
        const unsub = onAuthStateChanged(auth as any, (user) => {
            setCurrentUserId(user?.uid ?? null);
            setAuthChecked(true);
        });
        return () => unsub();
    }, []);

    // Fetch existing listing data
    useEffect(() => {
        if (!id || !db || !authChecked) return;

        const fetchListing = async () => {
            try {
                const snap = await getDoc(doc(db!, "rentals", id));
                if (!snap.exists()) {
                    setNotFound(true);
                    setFetchLoading(false);
                    return;
                }

                const data = snap.data();

                // Guard: only the owner can edit
                if (currentUserId && data.ownerId !== currentUserId) {
                    setNotOwner(true);
                    setFetchLoading(false);
                    return;
                }

                // Pre-fill all fields
                setName(data.itemName ?? "");
                setPrice(String(data.pricePerHour ?? ""));
                setBlock(data.block ?? "");
                setDepartment(data.department ?? DEPARTMENTS[0]);
                setCondition((data.condition as any) ?? "Good");
                setListingType((data.listingType as "rent" | "sell") ?? "rent");
                setExistingPhotoUrl(data.photoUrl ?? null);
                setPreview(data.photoUrl ?? null);

                // Map categoryId back to display name
                const matchedCat = GRID_CATEGORIES.find(c => c.id === data.categoryId);
                setCategory(matchedCat?.name ?? data.categoryId ?? "");

            } catch (err) {
                console.error("Failed to fetch listing:", err);
                toast.error("Could not load listing data.");
            } finally {
                setFetchLoading(false);
            }
        };

        fetchListing();
    }, [id, authChecked, currentUserId]);

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result as string);
            reader.readAsDataURL(file);
            const blob = await compressImageFile(file, { maxWidth: 1280, quality: 0.7 });
            setNewImage(new File([blob], `edit_${file.name}.jpg`, { type: "image/jpeg" }));
        } catch {
            toast.error("Failed to process image.");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim() || !price || !category) {
            toast.error("Please fill in Name, Category, and Price.");
            return;
        }
        if (!currentUserId) {
            toast.error("You must be signed in.");
            router.push("/login");
            return;
        }
        if (!db) return;

        setSaveLoading(true);
        try {
            const selectedCat = GRID_CATEGORIES.find(c => c.name === category);

            let photoUrl = existingPhotoUrl;

            // If user picked a new photo, convert to base64 instantly
            if (newImage) {
                const toBase64 = (f: File): Promise<string> =>
                    new Promise((res, rej) => {
                        const r = new FileReader();
                        r.onloadend = () => res(r.result as string);
                        r.onerror = rej;
                        r.readAsDataURL(f);
                    });
                photoUrl = await toBase64(newImage);
            }

            await updateDoc(doc(db!, "rentals", id), {
                itemName: name.trim(),
                pricePerHour: parseInt(price),
                block: block.trim(),
                department,
                condition,
                listingType,
                categoryId: selectedCat?.id ?? "others",
                ...(photoUrl ? { photoUrl } : {}),
                updatedAt: serverTimestamp(),
            });

            toast.success("Listing updated successfully");
            router.push("/profile");

            // Background: upgrade new photo to Storage URL
            if (newImage && storage) {
                (async () => {
                    try {
                        const imageRef = ref(storage!, `rentals/${id}_${currentUserId}.jpg`);
                        const uploaded = await uploadBytes(imageRef, newImage);
                        const storageUrl = await getDownloadURL(uploaded.ref);
                        await updateDoc(doc(db!, "rentals", id), { photoUrl: storageUrl });
                    } catch (e) {
                        console.warn("Storage upgrade failed (item still shows base64 photo):", e);
                    }
                })();
            }

        } catch (err: any) {
            console.error("Update error:", err);
            toast.error(`Failed to update listing: ${err?.message ?? "Unknown error"}`);
        } finally {
            setSaveLoading(false);
        }
    };

    // ── Error states ────────────────────────────────────────────────────────────
    if (notFound) return (
        <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-slate-50 px-5 text-center">
            <AlertTriangle className="w-12 h-12 text-rose-300 mb-4" />
            <h2 className="text-xl font-black text-slate-800">Listing not found</h2>
            <p className="text-sm text-slate-400 mt-2 mb-6">It may have been deleted.</p>
            <button onClick={() => router.push("/profile")} className="h-12 px-8 rounded-2xl gradient-indigo text-white font-black">
                Go to Profile
            </button>
        </div>
    );

    if (notOwner) return (
        <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-slate-50 px-5 text-center">
            <AlertTriangle className="w-12 h-12 text-amber-300 mb-4" />
            <h2 className="text-xl font-black text-slate-800">Not your listing</h2>
            <p className="text-sm text-slate-400 mt-2 mb-6">You can only edit your own items.</p>
            <button onClick={() => router.push("/profile")} className="h-12 px-8 rounded-2xl gradient-indigo text-white font-black">
                Go to Profile
            </button>
        </div>
    );

    if (fetchLoading) return (
        <div className="flex-1 flex items-center justify-center min-h-screen bg-slate-50">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
        </div>
    );

    // ── Form  ───────────────────────────────────────────────────────────────────
    return (
        <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
            {/* Header */}
            <header className="px-5 pt-12 pb-6 flex items-center gap-4 border-b border-indigo-100 bg-white/60 backdrop-blur-md sticky top-0 z-20">
                <button
                    onClick={() => router.back()}
                    className="p-2.5 bg-white border border-indigo-100 rounded-xl active:scale-95 transition-all text-slate-500 hover:text-indigo-600 shadow-sm"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-slate-800 leading-none" style={{ fontFamily: "Outfit, sans-serif" }}>
                        Edit Listing
                    </h1>
                    <p className="text-[11px] font-black text-indigo-500 uppercase tracking-widest mt-1.5">
                        Update your item details
                    </p>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="flex-1 px-5 space-y-7 py-8 pb-16 max-w-md mx-auto w-full">

                {/* Photo */}
                <div className="space-y-2.5">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">Item Photo</label>
                    <div
                        onClick={() => document.getElementById("edit-photo-input")?.click()}
                        className="aspect-[4/3] rounded-[2rem] border-2 border-dashed border-indigo-200 bg-white/50 flex flex-col items-center justify-center relative overflow-hidden group active:scale-[0.99] transition-all cursor-pointer hover:border-indigo-400 shadow-inner"
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
                                <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-400">
                                    <Camera className="w-8 h-8" />
                                </div>
                                <p className="text-[15px] font-bold text-slate-700">Tap to change photo</p>
                            </div>
                        )}
                        <input id="edit-photo-input" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    </div>
                </div>

                {/* Item Name */}
                <div className="space-y-2.5">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">Item Name *</label>
                    <input
                        type="text"
                        placeholder="e.g. Casio fx-991EX"
                        className="w-full bg-white/70 backdrop-blur-md border border-indigo-50 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 rounded-2xl h-14 px-5 text-slate-800 placeholder-slate-400 font-bold outline-none transition-all shadow-inner"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>

                {/* Listing Type */}
                <div className="space-y-2.5">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">Listing Type</label>
                    <div className="flex gap-2">
                        {(["rent", "sell"] as const).map(t => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setListingType(t)}
                                className={`flex-1 py-3 rounded-2xl text-sm font-black border transition-all active:scale-95 ${
                                    listingType === t
                                        ? t === "rent" ? "bg-indigo-500 text-white border-indigo-500 shadow-md"
                                                       : "bg-purple-500 text-white border-purple-500 shadow-md"
                                        : "bg-white/70 text-slate-500 border-slate-200"
                                }`}
                            >
                                {t === "rent" ? "For Rent" : "For Sale"}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Category & Price */}
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
                    <div className="space-y-2.5 w-1/2">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">
                            {listingType === "sell" ? "Selling Price (₹)" : "Price per hour (₹)"}
                        </label>
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
                    </div>
                </div>

                {/* Condition */}
                <div className="space-y-2.5">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">Item Condition *</label>
                    <div className="flex gap-2">
                        {(["Excellent", "Good", "Fair"] as const).map(c => (
                            <button
                                key={c}
                                type="button"
                                onClick={() => setCondition(c)}
                                className={`flex-1 py-3 rounded-2xl text-sm font-black border transition-all active:scale-95 ${
                                    condition === c
                                        ? c === "Excellent" ? "bg-emerald-500 text-white border-emerald-500 shadow-md"
                                          : c === "Good" ? "bg-indigo-500 text-white border-indigo-500 shadow-md"
                                          : "bg-amber-500 text-white border-amber-500 shadow-md"
                                        : "bg-white/70 text-slate-500 border-slate-200 hover:border-slate-300"
                                }`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Department */}
                <div className="space-y-2.5">
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

                {/* Block / Location */}
                <div className="space-y-2.5 relative">
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
                            <div className="absolute top-full left-0 right-0 mt-2 z-30 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
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
                                    ))
                                }
                            </div>
                        )}
                    </div>
                </div>

                {/* Submit */}
                <div className="pt-6">
                    <button
                        type="submit"
                        disabled={saveLoading}
                        className="w-full h-16 rounded-2xl gradient-indigo text-white font-black text-base shadow-indigo flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] hover:-translate-y-1 transition-all"
                    >
                        {saveLoading
                            ? <Loader2 className="animate-spin w-6 h-6" />
                            : <><Save className="w-5 h-5" /> Save Changes</>
                        }
                    </button>
                </div>
            </form>
        </div>
    );
}
