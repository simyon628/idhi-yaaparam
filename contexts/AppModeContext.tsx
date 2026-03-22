"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type AppMode = "rentals" | "writing";

interface AppModeContextType {
    mode: AppMode;
    setMode: (mode: AppMode) => void;
    hasPicked: boolean;
    setHasPicked: (v: boolean) => void;
}

const AppModeContext = createContext<AppModeContextType>({
    mode: "rentals",
    setMode: () => {},
    hasPicked: false,
    setHasPicked: () => {},
});

export function AppModeProvider({ children }: { children: ReactNode }) {
    const [mode, setModeState] = useState<AppMode>("rentals");
    const [hasPicked, setHasPickedState] = useState(false);

    // Load persisted choice from localStorage
    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            const saved = localStorage.getItem("iy_app_mode") as AppMode | null;
            const picked = localStorage.getItem("iy_mode_picked");
            if (saved) setModeState(saved);
            if (picked === "1") setHasPickedState(true);
        } catch (e) {
            console.warn("localStorage not available", e);
        }
    }, []);

    const setMode = (m: AppMode) => {
        setModeState(m);
        try { localStorage.setItem("iy_app_mode", m); } catch(e) {}
    };

    const setHasPicked = (v: boolean) => {
        setHasPickedState(v);
        try { localStorage.setItem("iy_mode_picked", v ? "1" : "0"); } catch(e) {}
    };

    return (
        <AppModeContext.Provider value={{ mode, setMode, hasPicked, setHasPicked }}>
            {children}
        </AppModeContext.Provider>
    );
}

export const useAppMode = () => useContext(AppModeContext);
