"use client";

import Link from "next/link";
import { ShieldX } from "lucide-react";

export default function BlockedPage() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center min-h-screen px-6 bg-slate-50 relative overflow-hidden">
            {/* Ambient Background Blobs - Danger Theme */}
            <div className="absolute top-[10%] left-[-10%] w-[50%] h-[50%] bg-rose-200/40 blob rounded-full mix-blend-multiply filter blur-3xl animate-float pointer-events-none" style={{ animationDelay: "0s" }} />
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[50%] bg-orange-200/30 blob rounded-full mix-blend-multiply filter blur-3xl animate-float pointer-events-none" style={{ animationDelay: "2s" }} />

            <div className="text-center space-y-8 relative z-10 max-w-sm w-full bg-white/70 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(225,29,72,0.15)] border border-rose-50">
                <div className="mx-auto relative">
                    <div className="absolute inset-0 bg-rose-500/20 blur-xl rounded-full" />
                    <div className="w-24 h-24 mx-auto rounded-[2rem] bg-rose-50 border border-rose-100 flex items-center justify-center relative shadow-inner">
                        <ShieldX className="w-12 h-12 text-rose-500 drop-shadow-sm" />
                    </div>
                </div>

                <div className="space-y-3">
                    <h1 className="text-3xl font-black text-slate-800" style={{ fontFamily: "Outfit, sans-serif" }}>Account Restricted</h1>
                    <p className="text-slate-500 leading-relaxed text-[15px] font-medium mx-auto max-w-[260px]">
                        Your account has been restricted due to trust violations. Contact your campus admin to appeal.
                    </p>
                </div>

                <div className="bg-rose-50 border border-rose-100/50 text-rose-600 px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest inline-block shadow-inner">
                    2 strikes reached
                </div>

                <div className="pt-4 border-t border-rose-50/50">
                    <Link
                        href="/login"
                        className="block text-blue-500 text-[13px] font-bold hover:text-blue-600 transition-colors"
                    >
                        Sign in with a different registered number
                    </Link>
                </div>
            </div>
        </div>
    );
}
