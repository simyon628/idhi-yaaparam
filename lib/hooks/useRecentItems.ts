"use client";

import { useState, useEffect, useCallback } from "react";
import { Listing } from "@/lib/types";

const STORAGE_KEY = "idhi_yaaparam_recent_items";
const MAX_ITEMS = 6;

export interface RecentItem {
    id: string;
    itemName: string;
    photoUrl?: string;
    pricePerHour: number;
    pricePerDay?: number;
    rating?: number;
    viewedAt: number;
}

export function useRecentItems() {
    const [recentItems, setRecentItems] = useState<RecentItem[]>([]);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setRecentItems(JSON.parse(stored));
            }
        } catch (e) {
            console.warn("Failed to parse recent items", e);
        }
    }, []);

    const addItem = useCallback((item: Listing | RecentItem) => {
        setRecentItems(prev => {
            const newItem: RecentItem = {
                id: item.id,
                itemName: item.itemName,
                photoUrl: item.photoUrl,
                pricePerHour: item.pricePerHour,
                pricePerDay: (item as any).pricePerDay,
                rating: (item as any).sellerRating,
                viewedAt: Date.now()
            };

            // Remove if exists
            const filtered = prev.filter(i => i.id !== newItem.id);
            
            // Add to front
            filtered.unshift(newItem);
            
            // Limit size
            const updated = filtered.slice(0, MAX_ITEMS);
            
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });
    }, []);

    const clearItems = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
        setRecentItems([]);
    }, []);

    return { recentItems, addItem, clearItems };
}
