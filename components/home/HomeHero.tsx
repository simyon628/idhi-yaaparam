"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Calculator, ShoppingBag, PenTool, CheckCircle2, IndianRupee } from "lucide-react";

interface HomeHeroProps {
    mode: "rent" | "buy" | "sell";
}

export function HomeHero({ mode }: HomeHeroProps) {
    const [step, setStep] = useState(0);

    // Auto-cycle the animation steps (each 2.5 seconds)
    useEffect(() => {
        const timer = setInterval(() => {
            setStep((s) => (s + 1) % 4);
        }, 2500);
        return () => clearInterval(timer);
    }, []);

    const config = {
        rent: {
            title: "Rent & Save",
            item: <Calculator className="w-8 h-8 text-indigo-500" />,
            labelA: "I have a Calculator",
            labelB: "I need one!",
            color: "var(--iy-primary)",
        },
        buy: {
            title: "Write & Earn",
            item: <PenTool className="w-8 h-8 text-emerald-500" />,
            labelA: "I can write well",
            labelB: "Need my record done",
            color: "#00C48C",
        },
        sell: {
            title: "Buy & Sell",
            item: <ShoppingBag className="w-8 h-8 text-amber-500" />,
            labelA: "Selling my Drafter",
            labelB: "Looking for a deal",
            color: "#FF9500",
        },
    }[mode];

    return (
        <motion.div
            className="relative w-full bg-slate-900/40 backdrop-blur-2xl rounded-[48px] border border-white/10 overflow-hidden p-8 min-h-[20vh] flex flex-col justify-between shadow-2xl my-4"
            style={{ background: config.color, opacity: 0.95 }}
        >
            {/* Ambient Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent" />

            <div className="relative z-10 text-center">
                <h3 className="text-white font-black text-3xl leading-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
                    The Smart Way to <br />
                    <span style={{ color: config.color }}>{mode === "rent" ? "Borrow" : mode === "buy" ? "Earn" : "Trade"}</span> on Campus.
                </h3>
            </div>

            <div className="relative h-40 mt-4">
                {/* Person A */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute left-6 bottom-0 flex flex-col items-center"
                >
                    {/* Bubble A */}
                    <AnimatePresence>
                        {step === 0 && (
                            <motion.div
                                initial={{ scale: 0, opacity: 0, y: 10 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0, opacity: 0 }}
                                className="absolute bottom-28 w-36 bg-white rounded-2xl p-3 shadow-2xl flex items-center gap-2 border border-slate-100"
                            >
                                <div className="p-2 bg-slate-50 rounded-xl">{config.item}</div>
                                <span className="text-[10px] font-black text-slate-800 leading-tight">{config.labelA}</span>
                                <div className="absolute bottom-[-8px] left-6 w-4 h-4 bg-white rotate-45 border-b border-r border-slate-100" />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Full‑body character A */}
                    <div className="flex flex-col items-center">
                        <div className="text-5xl mb-[-5px]">👨‍🎓</div>
                        <div className="w-10 h-16 bg-indigo-600 rounded-t-2xl rounded-b-lg shadow-inner relative">
                            <motion.div
                                animate={{ rotate: [-10, 10, -10] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="absolute top-2 left-[-6px] w-4 h-10 bg-indigo-500 rounded-full origin-top"
                            />
                            <motion.div
                                animate={{ rotate: [10, -10, 10] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="absolute top-2 right-[-6px] w-4 h-10 bg-indigo-500 rounded-full origin-top"
                            />
                        </div>
                        <div className="flex gap-2 mt-[-2px]">
                            <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-4 h-5 bg-slate-800 rounded-sm" />
                            <motion.div animate={{ y: [-4, 0, -4] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-4 h-5 bg-slate-800 rounded-sm" />
                        </div>
                    </div>
                </motion.div>

                {/* Person B */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute right-6 bottom-0 flex flex-col items-center"
                >
                    {/* Bubble B */}
                    <AnimatePresence>
                        {step === 1 && (
                            <motion.div
                                initial={{ scale: 0, opacity: 0, y: 10 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0, opacity: 0 }}
                                className="absolute bottom-28 w-36 bg-white rounded-2xl p-3 shadow-2xl flex items-center gap-2 border border-slate-100"
                            >
                                <span className="text-[10px] font-black text-slate-800 leading-tight flex-1 text-right">{config.labelB}</span>
                                <div className="p-2 bg-slate-50 rounded-xl text-2xl">❓</div>
                                <div className="absolute bottom-[-8px] right-6 w-4 h-4 bg-white rotate-45 border-b border-r border-slate-100" />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Full‑body character B */}
                    <div className="flex flex-col items-center">
                        <div className="text-5xl mb-[-5px]">👩‍🎓</div>
                        <div className="w-10 h-16 bg-emerald-600 rounded-t-2xl rounded-b-lg shadow-inner relative">
                            <motion.div
                                animate={{ rotate: [10, -10, 10] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="absolute top-2 left-[-6px] w-4 h-10 bg-emerald-500 rounded-full origin-top"
                            />
                            <motion.div
                                animate={{ rotate: [-10, 10, -10] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="absolute top-2 right-[-6px] w-4 h-10 bg-emerald-500 rounded-full origin-top"
                            />
                        </div>
                        <div className="flex gap-2 mt-[-2px]">
                            <motion.div animate={{ y: [-4, 0, -4] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-4 h-5 bg-slate-800 rounded-sm" />
                            <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-4 h-5 bg-slate-800 rounded-sm" />
                        </div>
                    </div>
                </motion.div>

                {/* Exchange animation (step 2) */}
                <AnimatePresence>
                    {step === 2 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        >
                            {/* Item moving A → B */}
                            <motion.div
                                initial={{ x: -40, y: -20, scale: 0.5, rotate: -10 }}
                                animate={{ x: 40, y: -20, scale: 1, rotate: 10 }}
                                transition={{ type: "spring", damping: 12 }}
                                className="bg-white p-3 rounded-2xl shadow-2xl z-20"
                            >
                                {config.item}
                            </motion.div>
                            {/* Money moving B → A */}
                            <motion.div
                                initial={{ x: 40, y: 0, scale: 0.5, rotate: 10 }}
                                animate={{ x: -40, y: 0, scale: 1, rotate: -10 }}
                                transition={{ type: "spring", damping: 12, delay: 0.1 }}
                                className="bg-emerald-500 p-3 rounded-2xl shadow-2xl z-20 text-white"
                            >
                                <IndianRupee className="w-6 h-6" />
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Success state (step 3) */}
                <AnimatePresence>
                    {step === 3 && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="absolute inset-0 flex flex-col items-center justify-center z-30"
                        >
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="bg-emerald-500 p-4 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.5)]"
                            >
                                <CheckCircle2 className="w-10 h-10 text-white" />
                            </motion.div>
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="mt-3 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1 rounded-full"
                            >
                                <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]" style={{ fontFamily: "'Syne', sans-serif" }}>
                                    Exchange Verified
                                </span>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
