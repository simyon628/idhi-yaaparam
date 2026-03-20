"use client";

import { useState } from "react";
import { Bookmark, Loader2 } from "lucide-react";
import { SearchFilter } from "@/lib/types";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";

interface Props {
    query: string;
    filters: SearchFilter;
}

export function SaveSearchButton({ query, filters }: Props) {
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = async () => {
        if (!auth?.currentUser) {
            toast.error("Please sign in to save your search");
            return;
        }

        if (saved) return;
        setLoading(true);

        try {
            await addDoc(collection(db as any, `users/${auth.currentUser.uid}/savedSearches`), {
                query,
                filters,
                userId: auth.currentUser.uid,
                createdAt: serverTimestamp()
            });
            setSaved(true);
            toast.success("Search saved! We'll notify you of new matches.");
        } catch (e) {
            console.error(e);
            toast.error("Failed to save search");
        } finally {
            setLoading(false);
        }
    };

    if (!query && Object.keys(filters).length === 0) return null;

    return (
        <button 
            onClick={handleSave}
            disabled={loading || saved}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                saved 
                ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
                : "bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50"
            }`}
        >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" /> : <Bookmark className={`w-3.5 h-3.5 ${saved ? "fill-emerald-500 text-emerald-500" : ""}`} />}
            {saved ? "Saved" : "Save Search"}
        </button>
    );
}
