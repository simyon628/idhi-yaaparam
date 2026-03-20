import { useState, useEffect } from "react";

export type ListingMode = "rent" | "buy" | "sell";

export function useListingMode() {
    const [listingMode, setListingModeState] = useState<ListingMode>("rent");
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem("iy_listing_mode");
        if (saved === "rent" || saved === "buy" || saved === "sell") {
            setListingModeState(saved as ListingMode);
        }
        setIsLoaded(true);
    }, []);

    const setListingMode = (mode: ListingMode) => {
        setListingModeState(mode);
        localStorage.setItem("iy_listing_mode", mode);
        // Also fire a storage event so other tabs/components on same page could re-render if we were to listen,
        // but for now simple state is fine.
    };

    return { listingMode, setListingMode, isModeLoaded: isLoaded };
}
