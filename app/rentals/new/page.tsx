"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
export const dynamic = "force-dynamic";
import { db, auth, storage } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Camera, ChevronLeft, Loader2, IndianRupee, MapPin } from "lucide-react";

const BLOCKS = ["Block A", "Block B", "Block C", "Block D", "Hostels"];
const CATEGORIES = [
    { name: "Calculator", icon: "🧮" },
    { name: "Drafter", icon: "📐" },
    { name: "Geometry Box", icon: "📏" },
    { name: "Scale/Rule", icon: "📏" },
    { name: "Book/Manual", icon: "📓" },
    { name: "Electronics", icon: "⚡" },
];

export default function NewRentalPage() {
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [block, setBlock] = useState("Block A");
    const [icon, setIcon] = useState("🧮");
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const router = useRouter();

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
        if (!name || !price || !image) {
            toast.error("Please fill all fields and capture a photo");
            return;
        }

        setLoading(true);
        try {
            const userId = auth?.currentUser?.uid;
            if (!userId || !storage || !db) throw new Error("Initialization error");

            // 1. Upload Image
            const storageRef = ref(storage, `rentals/${Date.now()}_${userId}.jpg`);
            await uploadBytes(storageRef, image);
            const photoUrl = await getDownloadURL(storageRef);

            // 2. Save Item
            await addDoc(collection(db, "rentals"), {
                ownerId: userId,
                itemName: name,
                pricePerHour: parseInt(price),
                block: block,
                icon: icon,
                photoUrl: photoUrl,
                status: "available",
                renterId: null,
                createdAt: serverTimestamp(),
            });

            toast.success("Item listed successfully!");
            router.push("/home");
        } catch (error: any) {
            console.error(error);
            toast.error("Failed to list item. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-zinc-950">
            <header className="px-6 py-8 flex items-center gap-4">
                <button onClick={() => router.back()} className="p-2 bg-white rounded-xl shadow-sm border border-zinc-100">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="text-2xl font-black text-zinc-900 leading-none">List New Item</h1>
            </header>

            <form onSubmit={handleSubmit} className="flex-1 px-6 space-y-8 pb-12">
                {/* Photo Upload */}
                <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Item Photo</Label>
                    <div
                        onClick={() => document.getElementById("photo-input")?.click()}
                        className="aspect-square rounded-[2rem] border-2 border-dashed border-zinc-200 bg-white flex flex-col items-center justify-center relative overflow-hidden group active:scale-[0.98] transition-all"
                    >
                        {preview ? (
                            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <div className="p-4 bg-primary/10 rounded-2xl group-hover:bg-primary/20 transition-colors">
                                    <Camera className="w-8 h-8 text-primary" />
                                </div>
                                <p className="text-sm font-bold text-zinc-400">Capture or Upload</p>
                            </div>
                        )}
                        <input id="photo-input" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    </div>
                </div>

                {/* Item Details */}
                <div className="space-y-6">
                    <div className="space-y-3">
                        <Label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Select Category</Label>
                        <div className="grid grid-cols-3 gap-3">
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat.name}
                                    type="button"
                                    onClick={() => { setName(cat.name); setIcon(cat.icon); }}
                                    className={`p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all ${name === cat.name ? "bg-zinc-900 border-zinc-900 text-white shadow-lg" : "bg-white border-zinc-100 text-zinc-500"
                                        }`}
                                >
                                    <span className="text-2xl">{cat.icon}</span>
                                    <span className="text-[10px] font-black uppercase tracking-tight">{cat.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="price" className="text-xs font-bold uppercase tracking-widest text-zinc-400">Price per Hour</Label>
                        <div className="relative">
                            <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <Input
                                id="price"
                                type="number"
                                placeholder="20"
                                className="pl-10 h-14 bg-white border-zinc-100 rounded-2xl text-lg font-bold"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Your Current Block</Label>
                        <div className="flex flex-wrap gap-2">
                            {BLOCKS.map((b) => (
                                <button
                                    key={b}
                                    type="button"
                                    onClick={() => setBlock(b)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${block === b ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-white border border-zinc-100 text-zinc-500"
                                        }`}
                                >
                                    {b}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="pt-4">
                    <Button type="submit" disabled={loading} className="w-full h-16 rounded-[1.5rem] text-lg font-black shadow-xl shadow-primary/20">
                        {loading ? <Loader2 className="animate-spin" /> : "LIST ITEM NOW"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
