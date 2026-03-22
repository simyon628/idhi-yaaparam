"use client";

import { useState, useRef, useEffect } from "react";
import { Calculator, CalendarCheck } from "lucide-react";

interface RentalCalculatorProps {
    pricePerHour: number;
    onDurationChange?: (hours: number, minutes: number) => void;
    onBorrow?: () => void;
    isBorrowLoading?: boolean;
}

const HOURS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
const MINUTES = [0, 15, 30, 45];
const MIN_LABELS = ["00", "15", "30", "45"];

export default function RentalCalculator({ 
    pricePerHour, 
    onDurationChange, 
    onBorrow,
    isBorrowLoading 
}: RentalCalculatorProps) {
    const [hTop, setHTop] = useState(40);
    const [mTop, setMTop] = useState(0);
    
    const hRef = useRef<HTMLDivElement>(null);
    const mRef = useRef<HTMLDivElement>(null);

    // FIX 2: Initial scroll position
    useEffect(() => {
        if (hRef.current) {
            hRef.current.scrollTop = 1 * 40;
        }
        if (mRef.current) {
            mRef.current.scrollTop = 0 * 40;
        }
    }, []);

    // FIX 1: Selected index calculation
    const hIdx = Math.round((hTop) / 40);
    const mIdx = Math.round((mTop) / 40);

    const selectedHours = HOURS[hIdx] ?? 0;
    const selectedMinutes = MINUTES[mIdx] ?? 0;

    const onDurationChangeRef = useRef(onDurationChange);
    useEffect(() => {
        onDurationChangeRef.current = onDurationChange;
    }, [onDurationChange]);

    useEffect(() => {
        if (onDurationChangeRef.current) {
            onDurationChangeRef.current(selectedHours, selectedMinutes);
        }
    }, [selectedHours, selectedMinutes]);

    const totalHours = selectedHours + (selectedMinutes / 60);
    const cost = Math.round(totalHours * pricePerHour);

    const getItemClass = (i: number, activeIdx: number) => {
        const diff = Math.abs(i - activeIdx);
        if (diff === 0) return "text-[22px] font-bold text-[#7F77DD]";
        if (diff === 1) return "text-[18px] font-medium text-[#9CA3AF]";
        return "text-[16px] font-medium text-[#D1D5DB]";
    };

    return (
        <div className="bg-white border-2 border-[#7F77DD] rounded-[20px] p-5 mb-6 shadow-sm max-w-sm mx-auto font-sans">
            <div className="flex items-center gap-2 mb-4 px-1">
                <Calculator className="text-[#7F77DD]" size={18} />
                <span className="text-[#7F77DD] text-[14px] font-medium">Estimate your rental cost</span>
            </div>

            <div className="bg-[#F8F7FF] rounded-[16px] p-[16px_12px] flex flex-col items-center">
                <div className="flex justify-center gap-10 w-full mb-2">
                    <span className="w-20 text-center text-[11px] text-[#9CA3AF] font-bold">HRS</span>
                    <span className="w-20 text-center text-[11px] text-[#9CA3AF] font-bold">MINS</span>
                </div>
                
                <div className="relative flex justify-center gap-10 overflow-hidden">
                    {/* FIX 3: Highlight Band */}
                    <div 
                        className="absolute left-0 right-0 bg-[#EEEDFE] rounded-lg z-0" 
                        style={{ top: "40px", height: "40px", position: "absolute" }}
                    />

                    <div 
                        ref={hRef}
                        onScroll={(e) => setHTop(e.currentTarget.scrollTop)}
                        className="w-20 h-[120px] overflow-y-scroll snap-y snap-mandatory scrollbar-hide z-10"
                        style={{ scrollbarWidth: "none", msOverflowStyle: "none", paddingTop: "40px", paddingBottom: "40px" }}
                    >
                        <style dangerouslySetInnerHTML={{ __html: `.scrollbar-hide::-webkit-scrollbar { display: none; }` }} />
                        {HOURS.map((h, i) => (
                            <div key={h} className="h-10 snap-center flex items-center justify-center shrink-0">
                                <span className={getItemClass(i, hIdx)}>{h}</span>
                            </div>
                        ))}
                    </div>

                    <div 
                        ref={mRef}
                        onScroll={(e) => setMTop(e.currentTarget.scrollTop)}
                        className="w-20 h-[120px] overflow-y-scroll snap-y snap-mandatory scrollbar-hide z-10"
                        style={{ scrollbarWidth: "none", msOverflowStyle: "none", paddingTop: "40px", paddingBottom: "40px" }}
                    >
                        {MINUTES.map((m, i) => (
                            <div key={m} className="h-10 snap-center flex items-center justify-center shrink-0">
                                <span className={getItemClass(i, mIdx)}>{MIN_LABELS[i]}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-5 flex flex-col items-center">
                <p className="text-[12px] text-gray-400 font-medium mb-1">
                    Duration: {selectedHours}h {MIN_LABELS[mIdx]}m
                </p>
                
                <p className="text-[#1D9E75] text-[32px] font-bold leading-tight">₹{cost}</p>
                
                <p className="text-[11px] text-gray-400 italic mt-1 mb-5">
                    Rate: ₹{pricePerHour} per hour
                </p>

                {selectedHours === 0 && selectedMinutes === 0 && (
                    <p className="text-red-500 font-bold mb-3 text-[12px]">Please select a duration above</p>
                )}
            </div>
        </div>
    );
}

