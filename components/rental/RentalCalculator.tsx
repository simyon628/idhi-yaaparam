"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, Clock, IndianRupee, ChevronDown } from "lucide-react";

interface RentalCalculatorProps {
    pricePerHour: number;
}

const DURATION_PRESETS = [
    { label: "1 hr", hours: 1 },
    { label: "3 hrs", hours: 3 },
    { label: "6 hrs", hours: 6 },
    { label: "1 day", hours: 24 },
    { label: "2 days", hours: 48 },
    { label: "1 week", hours: 168 },
];

export default function RentalCalculator({ pricePerHour }: RentalCalculatorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedHours, setSelectedHours] = useState<number | null>(null);
    const [customHours, setCustomHours] = useState("");

    const hours = selectedHours ?? (customHours ? parseFloat(customHours) : null);
    const total = hours ? (pricePerHour * hours).toFixed(2) : null;

    return (
        <div className="mb-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between bg-white border border-slate-100 rounded-2xl px-4 py-3 shadow-sm active:scale-[0.99] transition-all"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center">
                        <Calculator className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="text-left">
                        <p className="text-xs font-black text-slate-700">Cost Calculator</p>
                        <p className="text-[10px] text-slate-400 font-medium">
                            {total ? `₹${total} total` : "Estimate your rental cost"}
                        </p>
                    </div>
                </div>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                </motion.div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 38 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-white border border-slate-100 border-t-0 rounded-b-2xl px-4 pb-4 pt-2 shadow-sm">
                            {/* Presets */}
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2.5 mt-1">Select duration</p>
                            <div className="grid grid-cols-3 gap-2 mb-3">
                                {DURATION_PRESETS.map(p => (
                                    <button
                                        key={p.label}
                                        onClick={() => { setSelectedHours(p.hours); setCustomHours(""); }}
                                        className={`py-2 rounded-xl text-[11px] font-black border transition-all active:scale-95 ${selectedHours === p.hours
                                            ? "bg-indigo-600 text-white border-indigo-600 shadow-indigo"
                                            : "bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-200"
                                            }`}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>

                            {/* Custom Hours */}
                            <div className="relative mb-3">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                <input
                                    type="number"
                                    min="0.5"
                                    step="0.5"
                                    placeholder="or enter custom hours..."
                                    value={customHours}
                                    onChange={(e) => { setCustomHours(e.target.value); setSelectedHours(null); }}
                                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                                />
                            </div>

                            {/* Result */}
                            {total && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl p-3 flex items-center justify-between"
                                >
                                    <div>
                                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Estimated Total</p>
                                        <div className="flex items-center gap-0.5 text-indigo-700 font-black text-xl mt-0.5">
                                            <IndianRupee className="w-4 h-4" />
                                            {total}
                                        </div>
                                        <p className="text-[9px] text-slate-400 font-medium">
                                            ₹{pricePerHour}/hr × {hours} hrs
                                        </p>
                                    </div>
                                    <div className="text-3xl">💸</div>
                                </motion.div>
                            )}

                            {/* Rate display */}
                            <div className="mt-2 text-center text-[10px] font-bold text-slate-400">
                                Rate: ₹{pricePerHour} per hour
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
