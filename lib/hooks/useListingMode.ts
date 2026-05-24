import { create } from "zustand";

export type ListingMode = "rent" | "buy" | "sell";

interface ModeStore {
  listingMode: ListingMode;
  isLoaded: boolean;
  setListingMode: (mode: ListingMode) => void;
}

// Helper to safely get the initial mode once at startup
const getInitialMode = (): ListingMode => {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("iy_listing_mode");
      if (saved === "rent" || saved === "buy" || saved === "sell") {
        return saved as ListingMode;
      }
    } catch (e) {
      console.error("Failed to read from localStorage", e);
    }
  }
  return "rent";
};

const useModeStore = create<ModeStore>((set) => ({
  listingMode: getInitialMode(),
  isLoaded: typeof window !== "undefined",
  setListingMode: (mode) => {
    set({ listingMode: mode });
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("iy_listing_mode", mode);
      } catch (e) {
        console.error("Failed to write to localStorage", e);
      }
    }
  },
}));

export function useListingMode() {
  const { listingMode, setListingMode, isLoaded } = useModeStore();
  return { listingMode, setListingMode, isModeLoaded: isLoaded };
}
