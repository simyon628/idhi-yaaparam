"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { College } from "@/lib/types";

interface CollegeContextType {
    selectedCollege: College | null;
    setSelectedCollege: (college: College | null) => void;
    isReady: boolean;
}

const CollegeContext = createContext<CollegeContextType | undefined>(undefined);

export function CollegeProvider({ children }: { children: React.ReactNode }) {
    const [selectedCollege, setSelectedCollegeState] = useState<College | null>(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // Load from local storage on mount
        try {
            const saved = localStorage.getItem("iy_selected_college_obj");
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && typeof parsed === "object" && parsed.id) {
                    setSelectedCollegeState(parsed as College);
                }
            }
        } catch (e) {
            console.error("Failed to parse college from local storage", e);
        }
        setIsReady(true);
    }, []);

    const setSelectedCollege = (college: College | null) => {
        setSelectedCollegeState(college);
        if (college) {
            localStorage.setItem("iy_selected_college_obj", JSON.stringify(college));
        } else {
            localStorage.removeItem("iy_selected_college_obj");
        }
    };

    return (
        <CollegeContext.Provider value={{ selectedCollege, setSelectedCollege, isReady }}>
            {children}
        </CollegeContext.Provider>
    );
}

export function useCollege() {
    const context = useContext(CollegeContext);
    if (context === undefined) {
        throw new Error("useCollege must be used within a CollegeProvider");
    }
    return context;
}
