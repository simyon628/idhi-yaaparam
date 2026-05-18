import { create } from "zustand";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface SearchSuggestion {
  id: string;
  name: string;
  category: string;
  image?: string;
}

export interface RecentSearchItem {
  id: string;
  query: string;
  timestamp: number;
}

type SearchStatus = "idle" | "loading" | "success" | "error";

interface SearchState {
  isOpen: boolean;
  query: string;
  status: SearchStatus;
  suggestions: SearchSuggestion[];
  recentSearches: RecentSearchItem[];
  activeIndex: number;
}

interface SearchActions {
  open: () => void;
  close: () => void;
  setQuery: (q: string) => void;
  setSuggestions: (s: SearchSuggestion[]) => void;
  setStatus: (s: SearchStatus) => void;
  setActiveIndex: (i: number) => void;
  addRecent: (query: string) => void;
  executeSearch: (query: string) => void;
  clearRecent: () => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const LS_KEY = "iy_recent";

function loadRecent(): RecentSearchItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecent(items: RecentSearchItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  } catch {}
}

// ── Store ──────────────────────────────────────────────────────────────────────

export const useSearchStore = create<SearchState & SearchActions>((set, get) => ({
  // ── Initial State ────────────────────────────────────────────────────────────
  isOpen: false,
  query: "",
  status: "idle",
  suggestions: [],
  recentSearches: loadRecent(),
  activeIndex: -1,

  // ── Actions ──────────────────────────────────────────────────────────────────
  open: () => set({ isOpen: true, activeIndex: -1, status: "idle" }),

  close: () =>
    set({ isOpen: false, query: "", suggestions: [], activeIndex: -1, status: "idle" }),

  setQuery: (q) => {
    if (q.length === 0) {
      set({ query: q, activeIndex: -1, status: "idle", suggestions: [] });
    } else {
      set({ query: q, activeIndex: -1, status: "loading" });
    }
  },

  setSuggestions: (s) => set({ suggestions: s, status: "success" }),

  setStatus: (s) => set({ status: s }),

  setActiveIndex: (i) => set({ activeIndex: i }),

  addRecent: (query: string) => {
    if (!query.trim()) return;
    const normalized = query.trim();
    const existing = get().recentSearches.filter(
      (r) => r.query.toLowerCase() !== normalized.toLowerCase()
    );
    const newItem: RecentSearchItem = {
      id: `r_${Date.now()}`,
      query: normalized,
      timestamp: Date.now(),
    };
    const next = [newItem, ...existing].slice(0, 10);
    saveRecent(next);
    set({ recentSearches: next });
  },

  executeSearch: (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    get().addRecent(trimmed);
    set({ isOpen: false, query: "", suggestions: [], activeIndex: -1, status: "idle" });
    // Use window.location for simplicity — no Next.js router dependency in store
    if (typeof window !== "undefined") {
      window.location.href = `/search?q=${encodeURIComponent(trimmed)}`;
    }
  },

  clearRecent: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(LS_KEY);
    }
    set({ recentSearches: [] });
  },
}));
