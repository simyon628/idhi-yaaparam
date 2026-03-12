"use client";

import { useCollege } from "@/contexts/CollegeContext";
import { CategoryGrid } from "@/components/ui/CategoryGrid";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Plus, Grid, Map as MapIcon, Loader2 } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Listing } from "@/lib/types";

// Dynamic import for Leaflet (No SSR)
const CampusMap = dynamic(() => import("@/components/map/CampusMap"), { 
    ssr: false,
    loading: () => (
        <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center animate-pulse">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mb-2" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Campus Map...</span>
        </div>
    )
});

export default function RentalsMarketplace() {
    const router = useRouter();
    const { selectedCollege, isReady } = useCollege();
    const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
    const [items, setItems] = useState<Listing[]>([]);
    const [loadingMapItems, setLoadingMapItems] = useState(false);

    useEffect(() => {
        if (isReady && !selectedCollege) {
            router.push("/");
        }
    }, [isReady, selectedCollege, router]);

    // Load items for the map if in map mode
    useEffect(() => {
        if (viewMode === "map" && selectedCollege && db) {
            const fetchMapItems = async () => {
                setLoadingMapItems(true);
                try {
                    const q = query(
                        collection(db as any, "rentals"),
                        where("collegeId", "==", selectedCollege.id),
                        where("status", "==", "available")
                    );
                    const snap = await getDocs(q);
                    setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as Listing)));
                } catch (e) {
                    console.error("Map items fetch failed:", e);
                } finally {
                    setLoadingMapItems(false);
                }
            };
            fetchMapItems();
        }
    }, [viewMode, selectedCollege]);

    if (!isReady || !selectedCollege) return null;

    const handleFabClick = () => {
        if (!auth?.currentUser) {
            router.push("/login?redirect=/rentals/new");
        } else {
            router.push("/rentals/new");
        }
    };

    return (
        <div className="flex-1 flex flex-col min-h-screen bg-slate-50 relative pb-20 overflow-hidden">
            <TopBar />

            <div className="mt-[80px] px-5 flex-1 flex flex-col">
                <div className="py-4 flex justify-between items-end">
                    <div className="animate-page-enter">
                        <h1 className="text-2xl font-black text-slate-800 leading-tight" style={{ fontFamily: "Outfit, sans-serif" }}>
                            Marketplace <br />
                            <span className="text-indigo-600 font-bold text-xs tracking-wider uppercase">{selectedCollege.name}</span>
                        </h1>
                    </div>
                    
                    {/* Premium View Switcher */}
                    <div className="bg-white border border-slate-100 p-1 rounded-2xl shadow-sm flex items-center mb-1">
                        <button 
                            onClick={() => setViewMode("grid")}
                            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${viewMode === "grid" ? "bg-indigo-600 text-white shadow-indigo" : "text-slate-400 hover:text-slate-600"}`}
                        >
                            <Grid className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Grid</span>
                        </button>
                        <button 
                            onClick={() => setViewMode("map")}
                            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${viewMode === "map" ? "bg-indigo-600 text-white shadow-indigo" : "text-slate-400 hover:text-slate-600"}`}
                        >
                            <MapIcon className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Map</span>
                        </button>
                    </div>
                </div>

                <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-premium relative overflow-hidden mb-24">
                    {viewMode === "grid" ? (
                        <div className="h-full overflow-y-auto no-scrollbar p-2">
                            <CategoryGrid />
                        </div>
                    ) : (
                        <div className="absolute inset-0">
                            <CampusMap 
                                center={[selectedCollege.lat, selectedCollege.lng]} 
                                items={items} 
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Floating FAB */}
            <button
                onClick={handleFabClick}
                className="fixed bottom-24 right-5 z-40 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white py-3 px-5 rounded-2xl shadow-indigo transition-all flex items-center justify-center border border-white/20 gap-2 overflow-hidden ring-4 ring-white/30"
            >
                <Plus className="w-5 h-5 shrink-0" />
                <span className="font-black text-[11px] uppercase tracking-widest">List Item</span>
            </button>

            <BottomNav />
        </div>
    );
}
