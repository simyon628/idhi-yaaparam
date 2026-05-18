"use client";

import { useSuggestions } from "@/hooks/useSearch";
import SearchDropdown from "@/components/search/SearchDropdown";

// This client wrapper is needed because layout.tsx is a Server Component.
// It activates the suggestion-fetch side-effect and mounts the portal.
export default function SearchProvider() {
  useSuggestions(); // Live-fetches suggestions when store.query changes
  return <SearchDropdown />;
}
