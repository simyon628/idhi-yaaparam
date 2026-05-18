import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 1. Wishlist Store
interface WishlistState {
  items: Set<string>;
  toggleItem: (id: string) => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set) => ({
      items: new Set(),
      toggleItem: (id) =>
        set((state) => {
          const newItems = new Set(state.items);
          if (newItems.has(id)) newItems.delete(id);
          else newItems.add(id);
          return { items: newItems };
        }),
    }),
    {
      name: 'wishlist-storage',
      // zustand/persist doesn't natively serialize Sets easily, so we customize:
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const { state } = JSON.parse(str);
          return { state: { ...state, items: new Set(state.items) } };
        },
        setItem: (name, newValue: any) => {
          const str = JSON.stringify({
            state: { ...newValue.state, items: Array.from(newValue.state.items) },
          });
          localStorage.setItem(name, str);
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);

// 2. Cart Store
export interface CartItem {
  id: string;
  qty: number;
  duration: number; // in hours
}

interface CartState {
  items: Record<string, CartItem>;
  addItem: (id: string) => void;
  updateQty: (id: string, delta: number) => void;
  updateDuration: (id: string, hours: number) => void;
  removeItem: (id: string) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: {},
      addItem: (id) => set((state) => ({ items: { ...state.items, [id]: { id, qty: 1, duration: 1 } } })),
      updateQty: (id, delta) => set((state) => {
        const item = state.items[id];
        if (!item) return state;
        const newQty = item.qty + delta;
        if (newQty <= 0) {
          const { [id]: _, ...rest } = state.items;
          return { items: rest };
        }
        return { items: { ...state.items, [id]: { ...item, qty: newQty } } };
      }),
      updateDuration: (id, hours) => set((state) => {
        const item = state.items[id];
        if (!item) return state;
        return { items: { ...state.items, [id]: { ...item, duration: hours } } };
      }),
      removeItem: (id) => set((state) => {
        const { [id]: _, ...rest } = state.items;
        return { items: rest };
      })
    }),
    { name: 'cart-storage' }
  )
);

// 3. Auth Store
interface AuthState {
  userId: string | null;
  userProfile: any | null;
  setAuth: (userId: string | null, profile?: any) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      userId: null,
      userProfile: null,
      setAuth: (userId, profile) => set({ userId, userProfile: profile }),
      logout: () => set({ userId: null, userProfile: null }),
    }),
    { name: 'auth-storage' }
  )
);

// 4. Location Store
interface LocationState {
  userLat: number | null;
  userLng: number | null;
  distance: string;
  setLocation: (lat: number, lng: number) => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      userLat: null,
      userLng: null,
      distance: '0.0 km',
      setLocation: (lat, lng) => set({ userLat: lat, userLng: lng }),
    }),
    { name: 'location-storage' }
  )
);
