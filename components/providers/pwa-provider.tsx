"use client";

import { useEffect } from "react";

export function PWAProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        if ("serviceWorker" in navigator) {
            window.addEventListener("load", () => {
                navigator.serviceWorker.register("/sw.js").then(
                    (registration) => {
                        console.log("Service Worker registered with scope:", registration.scope);
                    },
                    (err) => {
                        console.log("Service Worker registration failed:", err);
                    }
                );
            });
        }
    }, []);

    return <>{children}</>;
}
