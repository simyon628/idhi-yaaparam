"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCollege } from "@/contexts/CollegeContext";
import { SelectCollegeModal } from "@/components/ui/SelectCollegeModal";
import { CategoryGrid } from "@/components/ui/CategoryGrid";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { MapPin, Navigation, Info, Plus } from "lucide-react";
import { auth } from "@/lib/firebase";

export default function UniversalLandingPage() {
  const router = useRouter();
  const { selectedCollege, isReady } = useCollege();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!isReady) return null;

  const handleFabClick = () => {
    if (!auth?.currentUser) {
      router.push("/login?redirect=/rentals/new");
    } else {
      router.push("/rentals/new");
    }
  };

  if (!selectedCollege) {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-[#FDFDFD] relative overflow-hidden font-sans">
        {/* Minimal Top Bar for Zero State */}
        <header className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-40">
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tight text-slate-800" style={{ fontFamily: "Outfit, sans-serif" }}>Idhi Yaaparam</span>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-6 mt-10 relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-slate-800 leading-[1.15]" style={{ fontFamily: "Outfit, sans-serif" }}>
            Rent, buy and share inside your campus
          </h1>
          <p className="text-slate-500 font-medium mt-4 text-base max-w-sm mx-auto">
            Choose your college to see what’s available around you.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 w-full max-w-sm mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg py-4 px-6 rounded-2xl shadow-indigo transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3"
            >
              <MapPin className="w-5 h-5" />
              Select your college
            </button>

            <button className="text-slate-500 font-bold text-sm flex items-center gap-1 hover:text-indigo-600 transition-colors">
              <Info className="w-4 h-4" /> How it works
            </button>
          </div>
        </div>

        <SelectCollegeModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          forceFullScreen={typeof window !== 'undefined' && window.innerWidth < 768}
        />
      </div>
    );
  }

  // College Overview State
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50 relative pb-20">
      <TopBar />

      <div className="mt-[80px] px-5 flex-1 flex flex-col">
        <div className="py-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h1 className="text-3xl font-black text-slate-800 leading-tight" style={{ fontFamily: "Outfit, sans-serif" }}>
            What you can rent in <br className="hidden md:block" />
            <span className="text-indigo-600">{selectedCollege.name}</span>
          </h1>
          <p className="text-slate-500 font-medium mt-2 text-sm max-w-[280px]">
            Choose a category to see what’s available in your campus.
          </p>
        </div>

        <div className="mt-2 bg-white rounded-3xl p-2 border border-slate-100 shadow-sm relative overflow-hidden flex-1 mb-24">
          <CategoryGrid />
        </div>
      </div>

      {/* Floating FAB for "Rent your item" (Mobile First) */}
      <button
        onClick={handleFabClick}
        className="fixed bottom-24 right-5 z-40 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white py-3 px-4 rounded-2xl shadow-indigo transition-all flex items-center justify-center border border-white/20 gap-2"
      >
        <Plus className="w-5 h-5" />
        <span className="font-bold text-sm">List Item</span>
      </button>

      <SelectCollegeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <BottomNav />
    </div>
  );
}
