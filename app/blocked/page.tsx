"use client";

import Link from "next/link";
import { ShieldX } from "lucide-react";

export default function BlockedPage() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center min-h-screen px-6 gradient-hero">
            <div className="text-center space-y-6">
                <div className="w-24 h-24 mx-auto rounded-full bg-rose-500/10 border border-rose-500/25 flex items-center justify-center">
                    <ShieldX className="w-12 h-12 text-rose-400" />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-white mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>Account Restricted</h1>
                    <p className="text-slate-500 leading-relaxed text-sm">
                        Your account has been restricted due to 2 or more trust violations. Contact your campus admin to appeal.
                    </p>
                </div>
                <div className="badge-rose px-4 py-2 rounded-full text-sm font-bold inline-block">
                    2 strikes reached
                </div>
                <Link
                    href="/login"
                    className="block text-indigo-400 text-sm font-semibold underline underline-offset-4"
                >
                    Sign in with a different number
                </Link>
            </div>
        </div>
    );
}
