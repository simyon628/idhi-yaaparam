"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
export const dynamic = "force-dynamic";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import { Search, School, X, Calculator, Ruler, Monitor, BookOpen, MapPin, MessageSquare, Bell } from "lucide-react";
import { useCollege } from "@/contexts/CollegeContext";
import { COLLEGES } from "@/lib/constants";
import { motion, AnimatePresence } from "framer-motion";

export default function LandingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const { selectedCollege, setSelectedCollege, isReady } = useCollege();

  // States for Hero Animation Sequence
  const [animationStep, setAnimationStep] = useState(0);

  useEffect(() => {
    // Auth Check
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

    // Start Hero Animation Loop
    const timer = setInterval(() => {
      setAnimationStep(prev => (prev + 1) % 4);
      // 0: Initial thought bubbles
      // 1: Phone Appears / Search Bar Focus
      // 2: Move Together & Trade
      // 3: Success state
    }, 3500);

    return () => {
      unsub();
      clearInterval(timer);
    };
  }, [router]);

  const handleSelectCollege = (college: any) => {
    setSelectedCollege(college);
    router.push("/home");
  };

  const [searchQuery, setSearchQuery] = useState("");

  if (checking) return null;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#FDFDFD] relative overflow-hidden font-sans">

      {/* ── Top Navigation (Logo + Action Block) ── */}
      <header className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-50">
        <div className="flex flex-col">
          <span className="text-2xl font-black tracking-tight text-slate-800" style={{ fontFamily: "Outfit, sans-serif" }}>Idhi Yaaparam</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Campus Marketplace</span>
        </div>

        {/* Sketch: Top right sticky menu block */}
        <div className="bg-white border-2 border-slate-900 rounded-2xl shadow-[4px_4px_0px_#0f172a] overflow-hidden flex flex-col font-black text-sm uppercase tracking-widest">
          <Link href="/home" className="px-5 py-2.5 border-b-2 border-slate-100 hover:bg-slate-50 transition-colors">Sell</Link>
          <Link href="/home" className="px-5 py-2.5 border-b-2 border-slate-100 hover:bg-slate-50 transition-colors">Buy</Link>
          <Link href="/home" className="px-5 py-2.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors">Rent</Link>
        </div>
      </header>

      {/* ── Floating SVG Elements (Inventory Background) ── */}
      <div className="absolute inset-0 pointer-events-none opacity-20 hidden md:block">
        <Monitor className="absolute top-[20%] left-[10%] w-16 h-16 text-slate-400 rotate-[-12deg]" />
        <BookOpen className="absolute top-[15%] right-[20%] w-20 h-20 text-slate-400 rotate-[15deg]" />
        <Ruler className="absolute bottom-[40%] left-[5%] w-24 h-24 text-slate-400 rotate-[-45deg]" />
        <Calculator className="absolute bottom-[35%] right-[10%] w-14 h-14 text-slate-400 rotate-[20deg]" />
      </div>

      <div className="flex-1 flex flex-col pt-28 max-w-5xl mx-auto w-full px-5 pb-20 relative">

        {/* ── Animated Hero Exchange ── */}
        <section className="relative w-full h-[350px] md:h-[450px] flex items-center justify-center mb-16">

          {/* Central App/Search element */}
          <motion.div
            initial={{ y: 50, opacity: 0, scale: 0.9 }}
            animate={{
              y: animationStep >= 1 ? 0 : 50,
              opacity: animationStep >= 1 ? 1 : 0,
              scale: animationStep >= 1 ? 1 : 0.9
            }}
            transition={{ type: "spring", bounce: 0.4 }}
            className="absolute z-30 w-full max-w-sm"
          >
            <div className="bg-white/90 backdrop-blur-xl border border-slate-200/50 p-6 rounded-[2rem] shadow-2xl items-center flex flex-col">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
                <School className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black text-slate-800 text-center mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>Select Your College</h2>
              <div className="relative w-full z-50">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search campus..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl h-12 pl-11 pr-4 text-slate-800 font-bold outline-none text-sm pointer-events-auto"
                />
              </div>

              {/* College Results Dropdown directly embedded for fast action */}
              {searchQuery.length > 0 && (
                <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto z-50">
                  {COLLEGES.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5).map(college => (
                    <button
                      key={college.id}
                      onClick={() => handleSelectCollege(college)}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0"
                    >
                      <div className="font-bold text-slate-800 text-sm">{college.name}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">{college.state}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Left Student (Buyer/Renter) */}
          <motion.div
            className="absolute left-[5%] md:left-[15%] z-20 flex flex-col items-center"
            animate={{
              x: animationStep >= 2 ? (typeof window !== 'undefined' && window.innerWidth < 768 ? 60 : 120) : 0
            }}
            transition={{ type: "spring", bounce: 0.2 }}
          >
            {/* Thought Bubble */}
            <AnimatePresence>
              {animationStep === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8, y: 10 }}
                  className="bg-slate-800 text-white text-xs md:text-sm font-bold px-4 py-2 rounded-xl rounded-bl-sm mb-3 shadow-lg whitespace-nowrap"
                >
                  "I want a drafter urgently"
                </motion.div>
              )}
            </AnimatePresence>

            <div className="w-16 h-16 md:w-24 md:h-24 bg-rose-100 rounded-full border-4 border-white shadow-xl flex items-center justify-center text-2xl md:text-3xl relative">
              👦🏽
              {/* Product Received Animation */}
              <AnimatePresence>
                {animationStep === 3 && (
                  <motion.div
                    initial={{ scale: 0, y: -20, opacity: 0 }}
                    animate={{ scale: 1, y: -40, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute -top-4 w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center border-2 border-slate-100"
                  >
                    <Ruler className="w-5 h-5 text-indigo-500" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <span className="font-bold text-[10px] uppercase tracking-widest text-slate-500 mt-3 bg-white px-2 py-0.5 rounded-full shadow-sm">Borrower</span>
          </motion.div>

          {/* Right Student (Owner) */}
          <motion.div
            className="absolute right-[5%] md:right-[15%] z-20 flex flex-col items-center"
            animate={{
              x: animationStep >= 2 ? (typeof window !== 'undefined' && window.innerWidth < 768 ? -60 : -120) : 0
            }}
            transition={{ type: "spring", bounce: 0.2 }}
          >
            {/* Thought Bubble */}
            <AnimatePresence>
              {animationStep === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8, y: 10 }}
                  className="bg-indigo-600 text-white text-xs md:text-sm font-bold px-4 py-2 rounded-xl rounded-br-sm mb-3 shadow-lg whitespace-nowrap"
                >
                  "I want to rent my drafter"
                </motion.div>
              )}
            </AnimatePresence>

            <div className="w-16 h-16 md:w-24 md:h-24 bg-emerald-100 rounded-full border-4 border-white shadow-xl flex items-center justify-center text-2xl md:text-3xl relative">
              👩🏻‍🦱
              {/* Product Held / Money Received */}
              <AnimatePresence mode="wait">
                {animationStep < 3 ? (
                  <motion.div
                    key="holding"
                    exit={{ opacity: 0, scale: 0 }}
                    className="absolute -top-4 w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center border-2 border-slate-100"
                  >
                    <Ruler className="w-5 h-5 text-indigo-500" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="paid"
                    initial={{ scale: 0, y: 0 }}
                    animate={{ scale: 1, y: -40 }}
                    className="absolute -top-4 bg-emerald-500 text-white font-black text-xs px-2 py-1 rounded-lg shadow-lg flex items-center whitespace-nowrap"
                  >
                    + ₹20
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <span className="font-bold text-[10px] uppercase tracking-widest text-slate-500 mt-3 bg-white px-2 py-0.5 rounded-full shadow-sm">Owner</span>
          </motion.div>

        </section>


        {/* ── Campus Radar Concept (Sketch Bottom Half) ── */}
        <section className="relative w-full bg-slate-50 rounded-[3rem] p-8 md:p-12 border-2 border-dashed border-slate-200 mt-8">

          <h3 className="text-xl font-black text-slate-800 mb-8 text-center uppercase tracking-widest opacity-40">Campus Radar Loop</h3>

          <div className="relative w-full h-[400px] max-w-2xl mx-auto">

            {/* Center User (Me) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20">
              <div className="w-16 h-16 bg-blue-500 text-white rounded-full flex items-center justify-center text-xl shadow-xl shadow-blue-500/20 border-4 border-white relative">
                Me
                <div className="absolute -inset-8 border border-blue-500/20 rounded-full animate-ping" />
                <div className="absolute -inset-16 border border-blue-500/10 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
              </div>
            </div>

            {/* CSC Department User */}
            <div className="absolute top-[10%] left-[10%] group">
              <div className="relative">
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white px-3 py-1.5 rounded-xl shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30 flex items-center gap-2">
                  <MessageSquare className="w-3 h-3 text-emerald-500" />
                  <span className="text-xs font-bold text-slate-700">Has Laptop</span>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-full border border-white shadow-md flex items-center justify-center text-lg z-20 relative">👨🏽‍🎓</div>
              </div>
              <div className="mt-2 text-center">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">CSC Dept</div>
                <div className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 rounded inline-block mt-0.5"><MapPin className="w-2 h-2 inline mr-0.5" />200m</div>
              </div>
            </div>

            {/* Mechanical Department User */}
            <div className="absolute bottom-[20%] left-[5%] group">
              <div className="relative">
                <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-white px-3 py-2 rounded-xl shadow-lg z-30 whitespace-nowrap border border-slate-100">
                  <span className="text-xs font-bold text-slate-700 block">I want calci/drafter</span>
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45 border-r border-b border-slate-100" />
                </div>
                <div className="w-12 h-12 bg-rose-100 rounded-full border border-white shadow-md flex items-center justify-center text-lg z-20 relative mt-4">👷🏽‍♂️</div>
              </div>
              <div className="mt-2 text-center">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Mech Dept</div>
                <div className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 rounded inline-block mt-0.5"><MapPin className="w-2 h-2 inline mr-0.5" />300m</div>
              </div>
            </div>

            {/* IT Department User */}
            <div className="absolute top-[30%] right-[10%] group">
              <div className="relative">
                <div className="absolute -top-10 -right-20 bg-indigo-600 px-3 py-1.5 rounded-xl shadow-lg z-30 flex items-center gap-2 whitespace-nowrap animate-bounce">
                  <Bell className="w-3 h-3 text-white fill-current" />
                  <span className="text-xs font-bold text-white">Got a notification</span>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full border border-white shadow-md flex items-center justify-center text-lg z-20 relative">👩🏽‍💻</div>
                <div className="absolute top-1/2 -left-20 -translate-y-1/2 bg-white/80 backdrop-blur-sm border border-slate-200 px-2 py-1 rounded text-[9px] font-bold text-slate-600 whitespace-nowrap">
                  He is near to you →
                </div>
              </div>
              <div className="mt-2 text-center">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">IT Dept</div>
                <div className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 rounded inline-block mt-0.5"><MapPin className="w-2 h-2 inline mr-0.5" />50m</div>
              </div>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}
