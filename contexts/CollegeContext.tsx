"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface CollegeContextType {
    selectedCollege: string | null;
    setSelectedCollege: (college: string) => void;
    isReady: boolean;
}

const CollegeContext = createContext<CollegeContextType | undefined>(undefined);

export function CollegeProvider({ children }: { children: React.ReactNode }) {
    const [selectedCollege, setSelectedCollegeState] = useState<string | null>(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // Load from local storage on mount
        const saved = localStorage.getItem("iy_selected_college");
        if (saved) {
            setSelectedCollegeState(saved);
        }
        setIsReady(true);
    }, []);

    const setSelectedCollege = (college: string) => {
        setSelectedCollegeState(college);
        localStorage.setItem("iy_selected_college", college);
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
