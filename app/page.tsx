"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCollege } from "@/contexts/CollegeContext";
import { InlineCollegeSelection } from "@/components/ui/InlineCollegeSelection";
import { MapPin, PenTool, ArrowRight, ArrowRightCircle } from "lucide-react";

export default function MultiServiceHomepage() {
  const router = useRouter();
  const { selectedCollege, isReady } = useCollege();

  // Controls when the user presses the 'Detect My College' button
  const [showDetector, setShowDetector] = useState(false);

  // If a user selects a college while the detector is open, forward them immediately.
  useEffect(() => {
    if (isReady && showDetector && selectedCollege) {
      router.push("/rentals");
    }
  }, [selectedCollege, isReady, showDetector, router]);

  if (!isReady) return null;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#FDFDFD] relative font-sans pb-12">
      {/* 1. Header (App name) */}
      <header className="w-full px-6 pt-10 pb-4 flex justify-between items-start shrink-0 relative z-10">
        <div className="flex flex-col">
          <span className="text-2xl font-black tracking-tight text-slate-800" style={{ fontFamily: "Outfit, sans-serif" }}>
            Idhi Yaaparam
          </span>
        </div>
      </header>

      <div className="flex-1 flex flex-col px-5 relative z-10 max-w-md mx-auto w-full">

        {/* 2. Hero Section */}
        <div className="mt-6 mb-10 text-left animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-[11px] font-black uppercase tracking-widest text-indigo-600 mb-4">
            For college students
          </div>
          <h1 className="text-[40px] leading-[1.1] font-black text-slate-800 tracking-tight" style={{ fontFamily: "Outfit, sans-serif" }}>
            Save on stuff. <br />
            <span className="text-indigo-600">Earn with skills.</span>
          </h1>
        </div>

        {/* 3. Section 1 – Campus Rentals (PRIMARY) */}
        <div className="bg-white rounded-3xl p-6 border-2 border-indigo-50 shadow-xl shadow-indigo-500/5 relative overflow-hidden mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mt-10 -mr-10" />

          <div className="relative z-10">
            <h2 className="text-2xl font-black text-slate-800 mb-2">Save Money on Campus</h2>
            <p className="text-slate-500 font-medium text-sm mb-6 leading-relaxed pr-4">
              Rent or borrow items from students in your college.
            </p>

            {showDetector ? (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <InlineCollegeSelection />
              </div>
            ) : (
              <button
                onClick={() => {
                  if (selectedCollege) {
                    router.push("/rentals");
                  } else {
                    setShowDetector(true);
                  }
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base py-4 px-6 rounded-2xl shadow-indigo transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 opacity-90" />
                  <span>{selectedCollege ? "Go to my Marketplace" : "Detect My College"}</span>
                </div>
                <ArrowRight className="w-5 h-5 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </button>
            )}
          </div>
        </div>

        {/* 4. Section 2 – Writing Work (SECONDARY) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-lg shadow-slate-200/50 relative overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -mt-10 -mr-10" />

          <div className="relative z-10">
            <h2 className="text-xl font-black text-slate-800 mb-2">Earn Money by Writing</h2>
            <p className="text-slate-500 font-medium text-sm mb-6 leading-relaxed pr-4">
              Get paid for assignments, records and project writing.
            </p>

            <button
              onClick={() => router.push("/writing")}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-base py-4 px-6 rounded-2xl transition-all active:scale-95 flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <PenTool className="w-5 h-5 text-slate-500" />
                <span>Start Writing Work</span>
              </div>
              <ArrowRightCircle className="w-5 h-5 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
