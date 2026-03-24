"use client";

import { useMemo } from "react";
import { useAllItems } from "./useAllItems";
import { Listing } from "@/lib/types";

export interface RecentItem {
    id: string;
    itemName: string;
    photoUrl?: string;
    pricePerHour: number;
    pricePerDay?: number;
    rating?: number;
    viewedAt: number; // kept for compatibility, replaced by createdAt logic
}

export function useRecentItems(collegeId?: string, mode: string = "all") {
    const { data: allItems = [] } = useAllItems(collegeId, undefined, true);

    const recentItems = useMemo(() => {
        let filtered = allItems;
        
        // Strict separation
        if (mode !== "all") {
            filtered = filtered.filter(item => item.listingType === mode);
        }
        
        // Sort by newest first
        const sorted = [...filtered].sort((a, b) => {
            const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : (a.createdAt as any)?.seconds || 0;
            const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : (b.createdAt as any)?.seconds || 0;
            return dateB - dateA;
        });

        // Take top 6 and map to RecentItem format expected by UI
        return sorted.slice(0, 6).map(item => ({
            id: item.id,
            itemName: item.itemName,
            photoUrl: item.photoUrl,
            pricePerHour: item.pricePerHour,
            pricePerDay: (item as any).pricePerDay,
            rating: (item as any).sellerRating,
            viewedAt: Date.now() // Mocked for compatibility
        }));
    }, [allItems, mode]);

    // Keep dummy addItem for compatibility if any old components still call it
    const addItem = (item: Listing | RecentItem) => {};
    const clearItems = () => {};

    return { recentItems, addItem, clearItems };
}
