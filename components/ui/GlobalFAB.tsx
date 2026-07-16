"use client";

import React, { useState, useRef } from "react";
import { Plus, X, Loader2, ImagePlus, Camera, IndianRupee, MapPin, GraduationCap, Calendar } from "lucide-react";
import { usePathname } from "next/navigation";
import { auth, db, storage } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast } from "sonner";
import { useCollege } from "@/contexts/CollegeContext";
import { theme } from "@/lib/theme.config";

export function GlobalFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [category, setCategory] = useState("");
  const [itemName, setItemName] = useState("");
  const [brand, setBrand] = useState("");
  const [condition, setCondition] = useState("Good");
  const [price, setPrice] = useState("");
  const [desc, setDesc] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { selectedCollege } = useCollege();
  const pathname = usePathname() || "";
  
  // Auto-set category based on path
  React.useEffect(() => {
    if (pathname.startsWith("/category/")) {
      setCategory(pathname.split("/category/")[1]);
    }
  }, [pathname]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!auth || !auth.currentUser) {
      toast.error("Please sign in to list an item.");
      return;
    }
    if (!category || !itemName || !price || !imageFile) {
      toast.error("Please fill in all required fields (Category, Name, Price, Image).");
      return;
    }

    setLoading(true);
    try {
      // 0. Check if user is verified
      const userDocRef = doc(db as any, "users", auth.currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists() || (!userDocSnap.data().isVerified && !userDocSnap.data().verified)) {
        toast.error("Please verify your student ID to list an item.");
        setLoading(false);
        return;
      }
      // Storage check removed since we are using Base64

      // 1. Convert image to Base64 (Firebase Storage CORS is not configured)
      const toBase64 = (file: File): Promise<string> => new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onloadend = () => res(reader.result as string);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });
      const photoUrl = await toBase64(imageFile);

      // 2. Add to Firestore
      await addDoc(collection(db as any, "rentals"), {
        ownerId: auth.currentUser.uid,
        collegeId: selectedCollege?.id || "svec", // Ensure collegeId is set
        itemName,
        category,
        brand,
        condition,
        pricePerHour: Number(price),
        description: desc,
        photoUrl,
        status: "available",
        createdAt: serverTimestamp(),
        // Mock rating fields for feed UI
        rating: 5.0,
        reviews: 0
      });

      toast.success("Item listed successfully!");
      setIsOpen(false);
      // Reset form
      setCategory(""); setItemName(""); setBrand(""); setPrice(""); setDesc("");
      setImageFile(null); setImagePreview(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to list item. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Show FAB ONLY on the main feed/category pages
  const isAllowedPath = 
    pathname === "/" || 
    pathname.startsWith("/category") || 
    pathname.startsWith("/rentals") || 
    pathname.startsWith("/near-you");

  // But NOT on specific rental detail pages (e.g. /rentals/[id])
  const isRentalDetail = pathname.match(/^\/rentals\/[^\/]+$/);

  if (!isAllowedPath || isRentalDetail) {
    return null;
  }

  return (
    <>
      {/* Pill FAB */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: "fixed",
          bottom: 88,
          right: 20,
          zIndex: 999,
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: theme.brand.primary,
          color: "#fff",
          padding: "0 18px",
          height: 44,
          borderRadius: 50,
          border: "none",
          boxShadow: `0 4px 16px ${theme.brand.primary}66`, // 40% opacity hex
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 500,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <Plus size={16} />
        List Item
      </button>

      {/* Bottom Sheet */}
      {isOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          {/* Backdrop */}
          <div onClick={() => !loading && setIsOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", animation: "fadeIn 0.2s" }} />
          
          {/* Sheet */}
          <div style={{ position: "relative", background: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: "24px 20px", maxHeight: "90vh", overflowY: "auto", animation: "slideUpSheet 0.3s cubic-bezier(0.16, 1, 0.3, 1)", fontFamily: "'DM Sans', sans-serif" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1e293b", fontFamily: "'Syne', sans-serif" }}>List an Item</h2>
              <button onClick={() => !loading && setIsOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={20} /></button>
            </div>

            <div className="flex flex-col gap-5">
              {/* Photo Upload */}
              <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5" /> Add Photo *
                  </label>
                  <div 
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative w-full aspect-video rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${imagePreview ? "border-transparent bg-transparent cursor-pointer" : "border-blue-100 bg-slate-50/50 hover:bg-slate-50 hover:border-blue-300 cursor-pointer overflow-hidden"}`}
                  >
                      {imagePreview ? (
                          <div className="relative w-full h-full">
                              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-2xl" />
                              <button 
                                  onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(null); }}
                                  className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 backdrop-blur-md"
                              >
                                  <X size={16} />
                              </button>
                          </div>
                      ) : (
                          <div className="flex flex-col items-center gap-3">
                              <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-slate-100">
                                  <Camera className="w-6 h-6 text-blue-500" />
                              </div>
                              <div className="text-center">
                                  <p className="text-sm font-bold text-slate-700">Tap to add photo</p>
                              </div>
                          </div>
                      )}
                      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                  </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">Category *</label>
                <div className="relative">
                    <select
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-blue-400 focus:bg-white rounded-2xl h-14 px-4 text-slate-700 font-bold outline-none appearance-none transition-all"
                    >
                        <option value="" disabled>Select Category</option>
                        <option value="Calculator">Calculator</option>
                        <option value="Drafter / Drawing Board">Drafter / Drawing Board</option>
                        <option value="Lab Coat">Lab Coat</option>
                        <option value="Laptop">Laptop</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Geometry Set">Geometry Set</option>
                        <option value="Books / Notes">Books / Notes</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <Plus className="w-4 h-4 rotate-45" />
                    </div>
                </div>
              </div>

              {/* Item Name */}
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">Item Name *</label>
                <input value={itemName} onChange={e => setItemName(e.target.value)} type="text" placeholder="e.g. Casio fx-991EX" className="w-full bg-slate-50 border border-slate-200 focus:border-blue-400 focus:bg-white rounded-2xl h-14 px-4 text-slate-800 placeholder-slate-400 font-bold outline-none transition-all" />
              </div>

              {/* Price */}
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">Price per hour (₹) *</label>
                <div className="flex items-center gap-2 bg-slate-50 rounded-2xl border border-slate-200 focus-within:border-blue-400 focus-within:bg-white h-14 px-4 transition-all">
                    <IndianRupee className="w-5 h-5 text-blue-500 shrink-0" />
                    <input
                        value={price}
                        onChange={e => setPrice(e.target.value)}
                        type="number"
                        placeholder="20"
                        className="w-full bg-transparent text-slate-800 placeholder-slate-400 font-black text-lg outline-none"
                    />
                </div>
              </div>

              {/* Condition */}
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">Condition *</label>
                <div className="flex gap-2">
                  {(["Excellent", "Good", "Fair"] as const).map(cond => (
                    <button
                        key={cond}
                        type="button"
                        onClick={() => setCondition(cond)}
                        className={`flex-1 py-3 rounded-2xl text-xs font-black border transition-all ${
                            condition === cond
                                ? cond === "Excellent" ? "bg-emerald-500 text-white border-emerald-500" :
                                  cond === "Good" ? "bg-blue-500 text-white border-blue-500" :
                                  "bg-amber-500 text-white border-amber-500"
                                : "bg-slate-50 text-slate-500 border-slate-200"
                        }`}
                    >
                        {cond === "Excellent" ? "✨ Excellent" : cond === "Good" ? "👍 Good" : "⚠️ Fair"}
                    </button>
                  ))}
                </div>
              </div>

              <button disabled={loading} onClick={handleSubmit} className="w-full h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-600 text-white font-black text-base shadow-lg shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-50 mt-2">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "List Item"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUpSheet { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
    </>
  );
}
