"use client";

import { useRouter } from "next/navigation";
export const dynamic = "force-dynamic";
import { auth } from "@/lib/firebase";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { AlertTriangle, Plus } from "lucide-react";
import { useCollege } from "@/contexts/CollegeContext";
import { SelectCollegeModal } from "@/components/ui/SelectCollegeModal";
import { CategoryGrid } from "@/components/ui/CategoryGrid";

export default function HomePage() {
    const router = useRouter();
    const { selectedCollege, isReady } = useCollege();

    const requireAuth = (callbackUrl: string) => {
        if (!auth?.currentUser) {
            router.push(`/login?redirect=${encodeURIComponent(callbackUrl)}`);
        } else {
            router.push(callbackUrl);
        }
    };

    if (!isReady) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
            </div>
        );
    }

    // Universal Landing: Enforce College Selection
    if (!selectedCollege) {
        return (
            <div className="flex-1 min-h-screen bg-slate-50 relative">
                <SelectCollegeModal isOpen={true} forceFullScreen={true} />
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col pb-32 min-h-screen bg-transparent relative overflow-hidden">
            {/* Ambient Background Blobs matching reference image */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-200/40 blob rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{ animationDelay: "0s" }} />
            <div className="absolute top-[20%] right-[-10%] w-[40%] h-[60%] bg-pink-200/30 blob rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{ animationDelay: "2s" }} />
            <div className="absolute bottom-[-10%] left-[20%] w-[60%] h-[40%] bg-purple-200/30 blob rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{ animationDelay: "4s" }} />
            <div className="absolute top-[40%] left-[30%] w-[30%] h-[30%] bg-cyan-200/20 blob rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{ animationDelay: "1s" }} />

            <div className="relative z-10 w-full flex-1 flex flex-col">
                <TopBar />

                {/* Floating FAB for "Rent your item" (Mobile First) */}
                <button
                    onClick={() => requireAuth("/rentals/new")}
                    className="fixed bottom-24 right-5 z-40 gradient-indigo hover:brightness-110 active:scale-95 text-white p-4 rounded-2xl shadow-indigo transition-all flex items-center justify-center border border-white/20"
                >
                    <Plus className="w-6 h-6" />
                </button>

                <div className="mt-24 px-5 space-y-8">

                    {/* Hero Text */}
                    <div className="pt-2 pb-2">
                        <h1 className="text-4xl font-black text-slate-800 leading-[1.1]" style={{ fontFamily: "Outfit, sans-serif" }}>
                            Welcome to<br />
                            <span className="text-indigo-600">{selectedCollege.name}</span>
                        </h1>
                        <p className="text-slate-500 font-medium mt-3 text-sm max-w-[280px]">
                            Browse essential items posted by students and faculty in your campus.
                        </p>
                    </div>

                    {/* Category Grid Section instead of Feed */}
                    <section className="glass rounded-3xl p-4 shadow-premium border border-white/60 relative overflow-hidden">
                        <CategoryGrid />
                    </section>

                    {/* Quick Action Buttons (matching Sell, Buy, Rent block in image) */}
                    <div className="glass p-4 rounded-3xl flex flex-col gap-3 shadow-premium">
                        <button className="w-full text-left px-5 py-3.5 rounded-2xl gradient-indigo text-white font-bold flex justify-between items-center shadow-indigo opacity-80" disabled>
                            Sell <span className="text-white/70 text-xs mt-0.5">(Coming soon)</span>
                        </button>
                        <button className="w-full text-left px-5 py-3.5 rounded-2xl gradient-cyan text-white font-bold flex justify-between items-center shadow-cyan opacity-80" disabled>
                            Buy <span className="text-white/70 text-xs mt-0.5">(Coming soon)</span>
                        </button>
                        <button onClick={() => requireAuth("/rentals/new")} className="w-full text-left px-5 py-3.5 rounded-2xl gradient-amber text-white font-bold flex justify-between items-center shadow-amber">
                            Rent an item <span className="text-white/70">›</span>
                        </button>
                    </div>

                    {/* Report Section */}
                    <section className="glass rounded-3xl p-6 border border-white/60 shadow-sm relative overflow-hidden group mt-4">
                        <div className="absolute inset-0 bg-gradient-to-br from-rose-100/30 to-transparent z-0 pointer-events-none" />
                        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-rose-100 rounded-xl">
                                        <AlertTriangle className="w-5 h-5 text-rose-500" />
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: "Outfit, sans-serif" }}>Report an issue</h2>
                                </div>
                                <p className="text-xs font-medium text-slate-500 max-w-[250px] mt-2">
                                    Had a problem with a rental or user? Report it here to keep our campus safe.
                                </p>
                            </div>
                            <button
                                onClick={() => requireAuth("/reports/new")}
                                className="bg-white hover:bg-slate-50 text-rose-600 border border-rose-100 px-5 py-3 rounded-xl text-sm font-bold transition-colors w-fit shadow-sm"
                            >
                                Write a report
                            </button>
                        </div>
                    </section>
                </div>

                <div className="h-6" />
                <BottomNav />
            </div>
        </div>
    );
}
