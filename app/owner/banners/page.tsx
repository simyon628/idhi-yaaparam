"use client";

import { useState, useRef, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, onSnapshot, query, orderBy } from "firebase/firestore";
import { uploadBannerImage, bannerUrl } from "@/lib/cloudinary";
import type { Banner } from "@/lib/types";
import { theme } from "@/lib/theme.config";
import { Plus, X, UploadCloud, Loader2, Save, Trash2, Power } from "lucide-react";
import { toast } from "sonner";
import { getBannerGradient } from "@/lib/hooks/useActiveBanners";

export default function ManageBanners() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    
    // Form state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [title, setTitle] = useState("");
    const [subtitle, setSubtitle] = useState("");
    const [ctaText, setCtaText] = useState("");
    const [ctaLink, setCtaLink] = useState("");
    const [displayOrder, setDisplayOrder] = useState("1");
    const [isActive, setIsActive] = useState(true);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch banners
    useEffect(() => {
        if (!db) return;
        const q = query(collection(db, "banners"), orderBy("displayOrder", "asc"));
        const unsub = onSnapshot(q, (snap) => {
            setBanners(snap.docs.map(d => ({ id: d.id, ...d.data() } as Banner)));
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const resetForm = () => {
        setEditingId(null);
        setTitle(""); setSubtitle(""); setCtaText(""); setCtaLink("");
        setDisplayOrder((banners.length + 1).toString());
        setIsActive(true);
        setImageFile(null); setImagePreview(null);
        setIsFormOpen(false);
    };

    const handleEdit = (b: Banner) => {
        setEditingId(b.id);
        setTitle(b.title); setSubtitle(b.subtitle);
        setCtaText(b.ctaText); setCtaLink(b.ctaLink);
        setDisplayOrder(b.displayOrder.toString());
        setIsActive(b.isActive);
        setImagePreview(b.imageUrl);
        setImageFile(null);
        setIsFormOpen(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title) return toast.error("Title is required");
        if (!imageFile && !imagePreview) return toast.error("Image is required");
        if (!auth?.currentUser) return toast.error("Not authenticated");

        setIsSaving(true);
        try {
            let finalImageUrl = imagePreview || "";
            
            // Upload new image if selected
            if (imageFile) {
                finalImageUrl = await uploadBannerImage(imageFile, editingId || undefined);
            }

            const bannerData = {
                title, subtitle, ctaText, ctaLink,
                displayOrder: Number(displayOrder),
                isActive,
                imageUrl: finalImageUrl,
            };

            if (editingId) {
                await updateDoc(doc(db as any, "banners", editingId), bannerData);
                toast.success("Banner updated");
            } else {
                await addDoc(collection(db as any, "banners"), {
                    ...bannerData,
                    createdAt: serverTimestamp(),
                    createdBy: auth.currentUser.uid
                });
                toast.success("Banner created");
            }
            resetForm();
        } catch (err) {
            console.error(err);
            toast.error("Failed to save banner");
        } finally {
            setIsSaving(false);
        }
    };

    const toggleActive = async (id: string, currentStatus: boolean) => {
        try {
            await updateDoc(doc(db as any, "banners", id), { isActive: !currentStatus });
            toast.success(currentStatus ? "Banner paused" : "Banner activated");
        } catch (err) {
            toast.error("Failed to update status");
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Delete this banner?")) return;
        try {
            await deleteDoc(doc(db as any, "banners", id));
            toast.success("Banner deleted");
        } catch (err) {
            toast.error("Failed to delete");
        }
    };

    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;

    if (isFormOpen) {
        return (
            <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between" style={{ background: theme.brand.gradient }}>
                    <h2 className="text-white font-black text-lg" style={{ fontFamily: "'Syne', sans-serif" }}>
                        {editingId ? "Edit Banner" : "New Banner"}
                    </h2>
                    <button onClick={resetForm} className="text-white/70 hover:text-white bg-white/10 p-1.5 rounded-full"><X className="w-5 h-5" /></button>
                </div>
                
                <form onSubmit={handleSave} className="p-5 flex flex-col gap-5">
                    {/* Image Upload */}
                    <div>
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1 mb-2 block">Banner Image * (Ratio 25:8)</label>
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="relative w-full aspect-[25/8] rounded-[16px] border-2 border-dashed border-indigo-200 bg-indigo-50/50 flex flex-col items-center justify-center cursor-pointer overflow-hidden group"
                        >
                            {imagePreview ? (
                                <>
                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-bold text-xs gap-2">
                                        <UploadCloud className="w-4 h-4" /> Change Image
                                    </div>
                                </>
                            ) : (
                                <div className="text-center">
                                    <UploadCloud className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
                                    <p className="text-xs font-bold text-indigo-600">Tap to upload image</p>
                                    <p className="text-[10px] font-medium text-slate-400 mt-1">Wide images work best</p>
                                </div>
                            )}
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">Title (Overlay)</label>
                            <input value={title} onChange={e=>setTitle(e.target.value)} required placeholder="e.g. Diwali Sale" className="w-full bg-slate-50 border border-slate-200 rounded-xl h-12 px-4 text-sm font-bold text-slate-800 outline-none focus:border-indigo-400 focus:bg-white" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">Subtitle</label>
                            <input value={subtitle} onChange={e=>setSubtitle(e.target.value)} placeholder="e.g. 20% off all calculators" className="w-full bg-slate-50 border border-slate-200 rounded-xl h-12 px-4 text-sm font-bold text-slate-800 outline-none focus:border-indigo-400 focus:bg-white" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">Button Text</label>
                            <input value={ctaText} onChange={e=>setCtaText(e.target.value)} placeholder="e.g. Shop Now" className="w-full bg-slate-50 border border-slate-200 rounded-xl h-12 px-4 text-sm font-bold text-slate-800 outline-none focus:border-indigo-400 focus:bg-white" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">Button Link</label>
                            <input value={ctaLink} onChange={e=>setCtaLink(e.target.value)} placeholder="e.g. /rentals?type=sell" className="w-full bg-slate-50 border border-slate-200 rounded-xl h-12 px-4 text-sm font-bold text-slate-800 outline-none focus:border-indigo-400 focus:bg-white" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">Display Order</label>
                            <input value={displayOrder} onChange={e=>setDisplayOrder(e.target.value)} type="number" min="1" className="w-full bg-slate-50 border border-slate-200 rounded-xl h-12 px-4 text-sm font-bold text-slate-800 outline-none focus:border-indigo-400 focus:bg-white" />
                        </div>
                        <div className="space-y-1.5 flex items-end pb-1">
                            <label className="flex items-center gap-2 cursor-pointer p-3 bg-slate-50 rounded-xl border border-slate-200 flex-1">
                                <input type="checkbox" checked={isActive} onChange={e=>setIsActive(e.target.checked)} className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500" />
                                <span className="text-sm font-bold text-slate-700">Active (Visible in Carousel)</span>
                            </label>
                        </div>
                    </div>

                    <button disabled={isSaving} type="submit" className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black text-sm shadow-md flex items-center justify-center gap-2 mt-2 disabled:opacity-50">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isSaving ? "Saving..." : "Save Banner"}
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <button 
                onClick={() => {
                    resetForm();
                    setIsFormOpen(true);
                }}
                className="w-full h-14 rounded-[20px] bg-white border-2 border-dashed border-indigo-200 text-indigo-600 font-black text-sm flex items-center justify-center gap-2 hover:bg-indigo-50 transition-colors"
            >
                <Plus className="w-5 h-5" /> Add New Banner
            </button>

            {banners.length === 0 ? (
                <div className="text-center p-10 bg-white rounded-[20px] border border-slate-100">
                    <p className="text-sm font-bold text-slate-500">No banners yet.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {banners.map((banner, i) => (
                        <div key={banner.id} className={`bg-white rounded-[20px] shadow-sm border overflow-hidden transition-all ${banner.isActive ? 'border-slate-200' : 'border-slate-100 opacity-70'}`}>
                            {/* Preview Area */}
                            <div className="relative aspect-[25/8] w-full" style={{ background: banner.imageUrl ? `url(${bannerUrl(banner.imageUrl)}) center/cover` : getBannerGradient(i) }}>
                                {/* Dark overlay */}
                                {banner.imageUrl && <div className="absolute inset-0 bg-black/40" />}
                                <div className="absolute inset-0 p-4 flex flex-col justify-center">
                                    <div className="text-[8px] font-black uppercase text-white/70 mb-1">PROMOTION</div>
                                    <h3 className="font-extrabold text-white text-lg leading-tight" style={{ fontFamily: "'Syne', sans-serif" }}>{banner.title}</h3>
                                    {banner.subtitle && <p className="text-white/80 text-[10px] font-medium mt-1">{banner.subtitle}</p>}
                                </div>
                                {!banner.isActive && (
                                    <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                        Paused
                                    </div>
                                )}
                            </div>
                            
                            {/* Actions Area */}
                            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                                <div className="text-xs font-bold text-slate-500 flex items-center gap-2">
                                    <span className="bg-slate-200 px-2 py-1 rounded-md text-[10px]">Order: {banner.displayOrder}</span>
                                    {banner.ctaLink && <span className="text-indigo-500 truncate max-w-[100px]">{banner.ctaLink}</span>}
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => toggleActive(banner.id, banner.isActive)} className={`p-2 rounded-lg transition-colors ${banner.isActive ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'}`}>
                                        <Power className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleEdit(banner)} className="p-2 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors">
                                        <span className="text-xs font-bold px-2">Edit</span>
                                    </button>
                                    <button onClick={() => handleDelete(banner.id)} className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
