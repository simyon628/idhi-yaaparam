"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
export const dynamic = "force-dynamic";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Package, Users, Zap, Lock, Star } from "lucide-react";

const FEATURES = [
  {
    icon: "📱",
    title: "OTP Phone Login",
    desc: "No passwords. One tap to enter."
  },
  {
    icon: "🎓",
    title: "Roll-No. Verified",
    desc: "AI scans your ID. No fakes allowed."
  },
  {
    icon: "⚡",
    title: "Real-time Listings",
    desc: "Live inventory across blocks."
  },
  {
    icon: "🛡️",
    title: "2-Strike System",
    desc: "Fair governance. Bad actors blocked."
  },
];

const HOW_IT_WORKS = [
  { step: "01", icon: "📋", title: "List Your Item", desc: "Snap a photo, set your price, pick your block." },
  { step: "02", icon: "🤝", title: "Get Requested", desc: "A student requests it. Approve with one tap." },
  { step: "03", icon: "✅", title: "Mark Returned", desc: "Confirm return. Trust scores stay clean." },
];

export default function LandingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!auth) { setChecking(false); return; }

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { setChecking(false); return; }
      if (!db) { router.push("/home"); return; }
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data()?.isVerified) {
          router.push("/home");
        } else {
          setChecking(false);
        }
      } catch {
        setChecking(false);
      }
    });

    return () => unsub();
  }, [router]);

  if (checking) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen gradient-hero">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl gradient-indigo flex items-center justify-center shadow-indigo animate-pulse">
            <span className="text-2xl">📦</span>
          </div>
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: `${i * 0.12}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">

      {/* ── Hero ── */}
      <section className="relative px-5 pt-16 pb-10 gradient-hero flex flex-col min-h-[75vh] justify-between">
        {/* Ambient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle, hsl(239,84%,67%) 0%, transparent 70%)" }} />

        <div className="relative z-10">
          {/* Brand */}
          <div className="flex items-center gap-2.5 mb-10">
            <div className="w-10 h-10 rounded-xl gradient-indigo flex items-center justify-center shadow-indigo">
              <span className="text-xl">📦</span>
            </div>
            <div>
              <span className="text-base font-black text-white" style={{ fontFamily: "Outfit, sans-serif" }}>Idhi Yaaparam</span>
              <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-widest">Campus Rental Network</p>
            </div>
          </div>

          {/* Trust pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full badge-trust text-xs font-semibold mb-6">
            <ShieldCheck className="w-3.5 h-3.5" />
            Verified Students Only
          </div>

          {/* Headline */}
          <h1 className="text-5xl font-black text-white leading-[1.05] mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>
            Your Campus.<br />
            <span style={{ background: "linear-gradient(135deg, hsl(239,84%,75%), hsl(43,96%,65%))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Verified.
            </span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed mb-8">
            Peer-to-peer lab tool rentals within your college. Borrow what you need. Lend what you own.
          </p>

          {/* CTA */}
          <Link
            href="/login"
            className="inline-flex items-center gap-2 gradient-indigo text-white font-black text-base px-6 py-4 rounded-xl shadow-indigo active:scale-[0.97] transition-all"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Trust bar */}
        <div className="relative z-10 mt-10 flex items-center justify-between py-4 border-t border-slate-800">
          {[
            { icon: Lock, label: "OTP Auth" },
            { icon: ShieldCheck, label: "ID Verified" },
            { icon: Star, label: "Trust Scores" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <Icon className="w-3.5 h-3.5 text-emerald-500" />
              {label}
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="px-5 py-10 space-y-4">
        <h2 className="text-xl font-black text-white mb-6" style={{ fontFamily: "Outfit, sans-serif" }}>
          Built for Trust
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="glass rounded-2xl border border-slate-700/50 p-4 space-y-3">
              <span className="text-2xl">{f.icon}</span>
              <div>
                <p className="font-black text-white text-sm">{f.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="px-5 py-6 space-y-4">
        <h2 className="text-xl font-black text-white mb-6" style={{ fontFamily: "Outfit, sans-serif" }}>
          How It Works
        </h2>
        <div className="space-y-3">
          {HOW_IT_WORKS.map((step, i) => (
            <div key={step.step} className="flex items-center gap-4 glass rounded-2xl border border-slate-700/40 p-4">
              <div className="w-12 h-12 rounded-xl gradient-indigo flex items-center justify-center text-white font-black text-sm shadow-indigo shrink-0">
                {step.icon}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{step.step}</span>
                  <p className="font-black text-white text-sm">{step.title}</p>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="px-5 py-10 mb-6">
        <div className="rounded-2xl p-6 text-center space-y-5" style={{
          background: "linear-gradient(135deg, hsl(239,84%,18%) 0%, hsl(258,90%,20%) 100%)",
          border: "1px solid hsl(239,84%,30%/0.4)"
        }}>
          <div className="w-14 h-14 mx-auto rounded-2xl gradient-indigo flex items-center justify-center shadow-indigo">
            <Zap className="w-7 h-7 text-white fill-white" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white" style={{ fontFamily: "Outfit, sans-serif" }}>Ready to start?</h3>
            <p className="text-slate-400 text-sm mt-1">Join your campus network in 2 minutes.</p>
          </div>
          <Link
            href="/login"
            className="block w-full gradient-indigo text-white font-black text-base py-4 rounded-xl shadow-indigo active:scale-[0.97] transition-all text-center"
          >
            Sign In with Phone →
          </Link>
        </div>
      </section>
    </div>
  );
}
