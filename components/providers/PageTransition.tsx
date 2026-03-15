"use client";

import { motion, AnimatePresence, Transition } from "framer-motion";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

// Smooth directional slide based on navigation depth
const variants = {
    initial: { opacity: 0, x: 24, y: 0, scale: 0.98 },
    animate: { opacity: 1, x: 0, y: 0, scale: 1 },
    exit: { opacity: 0, x: -24, y: 0, scale: 0.98 },
};

const transition: Transition = {
    type: "spring",
    stiffness: 260,
    damping: 20,
    mass: 1
};

export function PageTransition({ children }: { children: ReactNode }) {
    const pathname = usePathname();

    return (
        <AnimatePresence mode="wait" initial={false}>
            <motion.div
                key={pathname}
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={transition}
                className="flex flex-col flex-1 min-h-screen"
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}
