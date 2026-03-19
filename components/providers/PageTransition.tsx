"use client";

import { usePathname } from "next/navigation";
import React from "react";

export function PageTransition({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    
    // We completely remove AnimatePresence and motion wrappers 
    // to fix the pervasive blank screen navigation issue in Next.js App Router.
    return (
        <div className="min-h-screen flex flex-col w-full">
            {children}
        </div>
    );
}
