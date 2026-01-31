"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
export const dynamic = "force-dynamic";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Loader2 } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    // Basic auth check for initial redirect
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // If logged in, check if verified (mock check for now)
        router.push("/home");
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-6">
      <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center animate-pulse">
        <span className="text-4xl">📦</span>
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-zinc-900">Idhi Yaaparam</h1>
        <p className="text-zinc-500 font-medium">Loading your campus marketplace...</p>
      </div>
      <Loader2 className="w-6 h-6 animate-spin text-primary mt-4" />
    </div>
  );
}
