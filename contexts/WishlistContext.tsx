"use client";

import React, { createContext, useContext, useEffect, useReducer } from "react";
import { toast } from "sonner"; // Assuming sonner is used for toasts based on typical next.js setups, or I'll use a standard alert if it's not. Wait, I see sonner.tsx in components/ui earlier!

type WishlistState = {
  items: Set<string>;
};

type WishlistAction =
  | { type: "TOGGLE_ITEM"; payload: string }
  | { type: "INIT"; payload: Set<string> };

const initialState: WishlistState = {
  items: new Set(),
};

function wishlistReducer(state: WishlistState, action: WishlistAction): WishlistState {
  switch (action.type) {
    case "INIT":
      return { items: action.payload };
    case "TOGGLE_ITEM":
      const newItems = new Set(state.items);
      if (newItems.has(action.payload)) {
        newItems.delete(action.payload);
        toast("Removed from wishlist", { style: { background: "#333", color: "#fff", border: "none" } });
      } else {
        newItems.add(action.payload);
        toast("Added to wishlist", { style: { background: "#00C48C", color: "#fff", border: "none" } });
      }
      localStorage.setItem("iy_wishlist", JSON.stringify(Array.from(newItems)));
      return { items: newItems };
    default:
      return state;
  }
}

const WishlistContext = createContext<{
  state: WishlistState;
  dispatch: React.Dispatch<WishlistAction>;
} | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(wishlistReducer, initialState);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("iy_wishlist");
      if (stored) {
        dispatch({ type: "INIT", payload: new Set(JSON.parse(stored)) });
      }
    } catch (e) {
      console.error("Failed to load wishlist from localStorage", e);
    }
  }, []);

  return (
    <WishlistContext.Provider value={{ state, dispatch }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
