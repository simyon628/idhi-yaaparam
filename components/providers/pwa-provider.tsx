"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

export function PWAProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        if ("serviceWorker" in navigator) {
            window.addEventListener("load", () => {
                navigator.serviceWorker.register("/sw.js").then(
                    (registration) => {
                        console.log("Service Worker registered");

                        // Detect update
                        registration.addEventListener('updatefound', () => {
                            const newWorker = registration.installing;
                            if (newWorker) {
                                newWorker.addEventListener('statechange', () => {
                                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                        // A new service worker is available (and skipped waiting because of sw.js skipWaiting)
                                        // We show the notification for the user to refresh and see changes.
                                        toast("App updated! Tap to refresh", {
                                            duration: Infinity,
                                            action: {
                                                label: "Refresh Now",
                                                onClick: () => window.location.reload(),
                                            },
                                            icon: <RefreshCw className="w-4 h-4" />,
                                        });
                                    }
                                });
                            }
                        });
                    },
                    (err) => {
                        console.log("Service Worker registration failed:", err);
                    }
                );
            });

            // Silent update check on every page visit/load
            navigator.serviceWorker.ready.then(registration => {
                registration.update();
            });
        }
    }, []);

    return <>{children}</>;
}
