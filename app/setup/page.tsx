"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { toast } from "sonner";
import { DatabaseZap, Loader2, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

const CATEGORIES_SEED = [
    { id: 'cat-calculator',  name: 'Calculator',    icon: 'Calculator', color: 'bg-blue-50 text-blue-600',   keywords: ['calculator','casio','scientific','fx-991'] },
    { id: 'cat-drafter',    name: 'Drafter',        icon: 'Ruler',      color: 'bg-orange-50 text-orange-600', keywords: ['drafter','drawing board','drafting','mini drafter'] },
    { id: 'cat-labcoat',    name: 'Lab Coat',       icon: 'Shirt',      color: 'bg-green-50 text-green-600',  keywords: ['lab coat','labcoat','apron','white coat'] },
    { id: 'cat-geometry',   name: 'Geometry Set',   icon: 'Triangle',   color: 'bg-purple-50 text-purple-600', keywords: ['geometry','compass','protractor','set square'] },
    { id: 'cat-books',      name: 'Books/Notes',    icon: 'BookOpen',   color: 'bg-yellow-50 text-yellow-600', keywords: ['book','notes','textbook','notebook','guide'] },
    { id: 'cat-electronics',name: 'Electronics',    icon: 'Laptop',     color: 'bg-red-50 text-red-600',      keywords: ['laptop','phone','charger','earphone','powerbank','electronic','gadget'] },
    { id: 'cat-tools',      name: 'Tools',          icon: 'Wrench',     color: 'bg-gray-50 text-gray-600',    keywords: ['tool','wrench','hammer','screwdriver'] },
    { id: 'cat-others',     name: 'Others',         icon: 'Package',    color: 'bg-slate-50 text-slate-600',  keywords: [] },
];

export default function SetupPage() {
    const [seeding, setSeeding] = useState(false);
    const router = useRouter();

    const handleSeedCategories = async () => {
        if (!db) {
            toast.error("Database connection missing");
            return;
        }
        setSeeding(true);
        try {
            for (const cat of CATEGORIES_SEED) {
                await setDoc(doc(db, 'categories', cat.id), cat, { merge: true });
            }
            toast.success('All categories seeded successfully!');
        } catch (err) {
            console.error(err);
            toast.error('Failed to seed categories.');
        } finally {
            setSeeding(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col min-h-screen bg-slate-50 p-6">
            <button 
                onClick={() => router.back()} 
                className="flex items-center gap-1 text-slate-500 font-bold text-sm mb-8"
            >
                <ChevronLeft className="w-4 h-4" /> Back
            </button>

            <div className="max-w-md mx-auto w-full space-y-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">App Setup</h1>
                    <p className="text-sm font-bold text-slate-500 mt-1">Initialize or restore system data</p>
                </div>

                <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                            <DatabaseZap className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-800">Seeding Categories</h2>
                            <p className="text-xs text-slate-500">Create/Update the 8 main categories in Firestore</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {CATEGORIES_SEED.map(cat => (
                            <div key={cat.id} className="flex items-center justify-between text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-100">
                                <span className="font-bold text-slate-700">{cat.name}</span>
                                <span className="text-slate-400 font-mono">{cat.id}</span>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={handleSeedCategories}
                        disabled={seeding}
                        className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-indigo-600 text-white font-black uppercase tracking-widest disabled:opacity-50 active:scale-95 transition-all shadow-md shadow-indigo-100"
                    >
                        {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <DatabaseZap className="w-4 h-4" />}
                        {seeding ? 'Seeding...' : 'Seed All Now'}
                    </button>
                </div>
            </div>
        </div>
    );
}
