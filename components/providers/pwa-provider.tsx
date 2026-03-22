"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

export function PWAProvider({ children }: { children: React.ReactNode }) {
    const didCheck = useRef(false);

    useEffect(() => {
        if (!("serviceWorker" in navigator)) return;

        const registerAndUpdate = async () => {
            try {
                const registration = await navigator.serviceWorker.register("/sw.js");
                console.log("Service Worker registered");

                // Silent update check — runs on every page load
                await registration.update();

                // Listen for new worker installing
                registration.addEventListener("updatefound", () => {
                    const newWorker = registration.installing;
                    if (!newWorker) return;

                    newWorker.addEventListener("statechange", () => {
                        if (
                            newWorker.state === "activated" &&
                            navigator.serviceWorker.controller
                        ) {
                            // New SW activated — reload silently to serve new code
                            window.location.reload();
                        } else if (
                            newWorker.state === "installed" &&
                            navigator.serviceWorker.controller
                        ) {
                            // Fallback: show notification if activation is delayed
                            toast("App updated!", {
                                duration: Infinity,
                                action: {
                                    label: "Refresh Now",
                                    onClick: () => window.location.reload(),
                                },
                                icon: <RefreshCw className="w-4 h-4" />,
                            });
                        }
                    });
                });
            } catch (err) {
                console.log("Service Worker registration failed:", err);
            }
        };

        // Run once per page load
        if (!didCheck.current) {
            didCheck.current = true;
            registerAndUpdate();
        }

        // Also trigger update check when user returns to the tab
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                navigator.serviceWorker.ready.then(reg => reg.update()).catch(() => {});
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, []);

    return <>{children}</>;
}
