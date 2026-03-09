"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePageFallback() {
    const router = useRouter();

    useEffect(() => {
        router.push("/rentals");
    }, [router]);

    return (
        <div className="flex-1 flex flex-col min-h-screen bg-slate-50 items-center justify-center">
            <div className="w-8 h-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
            <p className="mt-4 text-slate-500 font-bold font-sm">Loading your campus marketplace...</p>
        </div>
    );
}
