"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Dashboard has been merged into the Profile page (3-tab design)
// This redirect ensures any old links or bookmarks still work
export default function DashboardRedirect() {
    const router = useRouter();
    useEffect(() => {
        router.replace("/profile?tab=stats");
    }, [router]);
    return null;
}
