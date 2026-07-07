/**
 * lib/hooks/useActiveBanners.ts
 *
 * Real-time hook that fetches active banners from Firestore.
 * Used by the homepage carousel — auto-updates when the owner
 * adds/removes/reorders banners from the Owner Panel.
 *
 * Falls back to hardcoded promo banners if no DB banners exist.
 */

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import type { Banner } from "@/lib/types";

// Fallback banners — shown when no banners exist in Firestore
const FALLBACK_BANNERS: Banner[] = [
  {
    id: "fb-sell",
    imageUrl: "",
    title: "Buy & Sell Student Essentials",
    subtitle: "Electronics, books & campus items",
    ctaText: "Shop Now",
    ctaLink: "/rentals?type=sell",
    displayOrder: 1,
    isActive: true,
    createdAt: new Date(),
    createdBy: "system",
  },
  {
    id: "fb-rent",
    imageUrl: "",
    title: "Rent Smarter on Campus",
    subtitle: "Lab coats, calculators & laptops from students",
    ctaText: "Explore Rentals",
    ctaLink: "/rentals?type=rent",
    displayOrder: 2,
    isActive: true,
    createdAt: new Date(),
    createdBy: "system",
  },
  {
    id: "fb-write",
    imageUrl: "",
    title: "Assignment Help & Writing",
    subtitle: "Records, notes & project writing",
    ctaText: "Explore Writing",
    ctaLink: "/rentals?type=buy",
    displayOrder: 3,
    isActive: true,
    createdAt: new Date(),
    createdBy: "system",
  },
];

// Gradient backgrounds for banners without images
const BANNER_GRADIENTS = [
  "linear-gradient(135deg, #0B57D0 0%, #1A73E8 100%)", // Main blue
  "linear-gradient(135deg, #1A73E8 0%, #4285F4 100%)", // Lighter blue
  "linear-gradient(135deg, #0B57D0 0%, #0945A6 100%)", // Darker blue
];

export function getBannerGradient(index: number): string {
  return BANNER_GRADIENTS[index % BANNER_GRADIENTS.length];
}

export function useActiveBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) {
      setBanners(FALLBACK_BANNERS);
      setLoading(false);
      return;
    }

    // Query: active banners, ordered by displayOrder
    const q = query(
      collection(db, "banners"),
      where("isActive", "==", true),
      orderBy("displayOrder", "asc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const now = new Date();
        const activeBanners = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Banner))
          .filter((banner) => {
            // Filter by date range if start/end dates are set
            if (banner.startDate) {
              const start =
                banner.startDate instanceof Date
                  ? banner.startDate
                  : (banner.startDate as any).toDate
                    ? (banner.startDate as any).toDate()
                    : new Date(banner.startDate as any);
              if (now < start) return false;
            }
            if (banner.endDate) {
              const end =
                banner.endDate instanceof Date
                  ? banner.endDate
                  : (banner.endDate as any).toDate
                    ? (banner.endDate as any).toDate()
                    : new Date(banner.endDate as any);
              if (now > end) return false;
            }
            return true;
          });

        setBanners(activeBanners.length > 0 ? activeBanners : FALLBACK_BANNERS);
        setLoading(false);
      },
      (err) => {
        console.error("Banner fetch error:", err);
        setBanners(FALLBACK_BANNERS);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  return { banners, loading };
}
