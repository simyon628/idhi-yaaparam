"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCollege } from "@/contexts/CollegeContext";
import { Listing, SearchFilter } from "@/lib/types";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { RentalCard } from "@/components/rental/RentalCard";
import { SearchFilters } from "@/components/search/SearchFilters";
import { SearchSuggestions, Suggestion } from "@/components/search/SearchSuggestions";
import { SaveSearchButton } from "@/components/search/SaveSearchButton";
import { useRecentItems } from "@/lib/hooks/useRecentItems";
import { useListingMode } from "@/lib/hooks/useListingMode";
import { Search, Loader2, SlidersHorizontal, X, ArrowUpLeft, Mic } from "lucide-react";
import { toast } from "sonner";

export default function SearchPage() {
    const router = useRouter();
    const { selectedCollege } = useCollege();
    const { listingMode } = useListingMode();
    
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [filters, setFilters] = useState<SearchFilter>({});
    const [isListening, setIsListening] = useState(false);
    
    const { recentItems } = useRecentItems();
    
    // User's location (optional, could be tracked in a real app, hardcoded here for demo or pulled from navigator)
    const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

    // Debounce refs
    const suggestTimeout = useRef<any>(null);
    const searchTimeout = useRef<any>(null);

    // Get suggestion as user types
    useEffect(() => {
        if (!selectedCollege || query.length < 2 || searched) {
            setSuggestions([]);
            return;
        }

        if (suggestTimeout.current) clearTimeout(suggestTimeout.current);
        
        suggestTimeout.current = setTimeout(async () => {
            try {
                const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(query)}&collegeId=${selectedCollege.id}`);
                const data = await res.json();
                if (data.suggestions) setSuggestions(data.suggestions);
            } catch (e) {
                console.error("Suggest error", e);
            }
        }, 150); // Fast debounce for suggestions

        return () => {
            if (suggestTimeout.current) clearTimeout(suggestTimeout.current);
        };
    }, [query, selectedCollege, searched]);

    // Full Search Logic
    const handleSearch = useCallback(async (forcedQuery?: string, activeFilters?: SearchFilter) => {
        if (!selectedCollege) return;
        
        const q = typeof forcedQuery === "string" ? forcedQuery : query;
        const f = activeFilters || filters;
        
        setLoading(true);
        setSearched(true);
        setSuggestions([]); // hide suggestions
        setShowFilters(false);
        
        try {
            let url = `/api/search?q=${encodeURIComponent(q)}&collegeId=${selectedCollege.id}&mode=${listingMode}`;
            if (userLocation) {
                url += `&lat=${userLocation.lat}&lng=${userLocation.lng}`;
            }
            if (Object.keys(f).length > 0) {
                url += `&filters=${encodeURIComponent(JSON.stringify(f))}`;
            }

            const res = await fetch(url);
            const data = await res.json();
            
            if (data.results) {
                setResults(data.results);
            }
            
            // If data.suggestions is returned (fallback case), we might want to handle it
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [query, filters, selectedCollege, listingMode, userLocation]);

    // Voice Search Feature
    const handleVoiceSearch = useCallback(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast.error("Voice search is not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsListening(true);
            toast.info("Listening...");
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setQuery(transcript);
            handleSearch(transcript);
            setIsListening(false);
        };

        recognition.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            setIsListening(false);
            if (event.error === 'not-allowed') toast.error("Microphone access blocked");
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        try {
            recognition.start();
        } catch(e) { console.error(e); }
    }, [handleSearch]);

    // Trigger full search gracefully when pausing typing (e.g. 500ms) or when filters change
    useEffect(() => {
        if (query.length === 0) return;
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        
        searchTimeout.current = setTimeout(() => {
            if (!searched && query.length > 2) {
               handleSearch();
            }
        }, 800);

        return () => {
            if (searchTimeout.current) clearTimeout(searchTimeout.current);
        };
    }, [query, handleSearch, searched]);

    return (
        <div className="flex-1 flex flex-col min-h-screen bg-slate-50 pb-24">
            <TopBar />

            <div className="sticky top-[60px] z-30 bg-white/90 backdrop-blur-xl border-b border-slate-100 px-5 py-3 space-y-3">
                <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 h-12 focus-within:border-indigo-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-50 transition-all shadow-inner relative">
                        <Search className="w-4 h-4 text-slate-400 shrink-0" />
                        <input
                            type="text"
                            value={query}
                            onChange={e => { setQuery(e.target.value); setSearched(false); }}
                            onKeyDown={e => e.key === "Enter" && handleSearch()}
                            placeholder="Search items in your college..."
                            className="flex-1 bg-transparent text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none"
                            autoFocus
                        />
                        {query && (
                            <button onClick={() => { setQuery(""); setResults([]); setSearched(false); setSuggestions([]); }}>
                                <X className="w-4 h-4 text-slate-400" />
                            </button>
                        )}
                        {!query && (
                            <button onClick={handleVoiceSearch} title="Voice Search">
                                <Mic className={`w-4 h-4 ${isListening ? "text-rose-500 animate-pulse" : "text-slate-400"} hover:text-indigo-500 transition-colors`} />
                            </button>
                        )}
                        
                        {!searched && (
                            <SearchSuggestions 
                                suggestions={suggestions} 
                                query={query} 
                                onSelect={(q) => { setQuery(q); handleSearch(q); }} 
                            />
                        )}
                    </div>
                    
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all ${showFilters || Object.keys(filters).length > 0 ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-slate-200 text-slate-600"} shadow-sm`}
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                    </button>
                </div>

                {showFilters && (
                    <SearchFilters 
                        filters={filters} 
                        setFilters={setFilters} 
                        onApply={() => handleSearch(query, filters)} 
                    />
                )}
            </div>

            <main className="px-5 pt-5 space-y-4 relative">
                {loading ? (
                    <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-400" /></div>
                ) : searched && results.length === 0 ? (
                    <div className="py-6 space-y-6">
                        <div className="text-center px-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Search className="w-6 h-6 text-slate-400" />
                            </div>
                            <p className="text-slate-800 font-black text-lg leading-tight">No exact matches for "{query}"</p>
                            <p className="text-slate-500 text-[13px] font-medium mt-1 mb-6">Showing closest relevant results or popular items instead.</p>
                            <button 
                                onClick={() => router.push("/requests/new")}
                                className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-indigo active:scale-95 transition-all w-full max-w-xs mx-auto text-center"
                            >
                                Request This Item
                            </button>
                        </div>
                        
                        <div className="space-y-4 px-1 pt-4 border-t border-slate-100">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></span>
                                Top Picks Nearby
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {["Calculator", "Drafter", "Lab Coat"].map(tag => (
                                    <button 
                                        key={tag}
                                        onClick={() => { setQuery(tag); handleSearch(tag); }}
                                        className="px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-[11px] font-black text-slate-600 hover:border-indigo-400 hover:text-indigo-600 active:scale-95 transition-all shadow-sm flex items-center gap-2"
                                    >
                                        {tag}
                                        <ArrowUpLeft className="w-3 h-3 text-slate-300 opacity-40 rotate-90" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : !searched ? (
                    <div className="py-6 space-y-6">
                        <div className="text-center">
                            <div className="text-5xl mb-3">🔍</div>
                            <p className="text-slate-500 font-bold text-sm">Search anything — Calculator, Drafter, Lab Record...</p>
                        </div>

                        {recentItems.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                                    Recently Viewed
                                </h3>
                                <div className="flex overflow-x-auto pb-4 -mx-5 px-5 gap-3 snap-x">
                                    {recentItems.map(item => (
                                        <div key={item.id} onClick={() => router.push(`/rentals/${item.id}`)} className="snap-start shrink-0 w-36 flex flex-col gap-2 cursor-pointer group">
                                            <div className="w-36 h-28 bg-slate-200 rounded-2xl overflow-hidden relative shadow-sm group-active:scale-95 transition-transform">
                                                <img src={item.photoUrl || `https://placehold.co/400x225/e2e8f0/4f46e5?text=📦`} className="w-full h-full object-cover" />
                                                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur text-[10px] font-black px-1.5 py-0.5 rounded text-indigo-600 shadow-sm border border-white/50">
                                                    ₹{item.pricePerHour}/hr
                                                </div>
                                            </div>
                                            <p className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-indigo-600">{item.itemName}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1 flex items-center gap-2">
                                <span className="w-1 h-1 bg-indigo-500 rounded-full animate-pulse"></span>
                                Trending Searches
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {["Calculator", "Drafter", "Lab Coat", "Scientific Calculator", "Casio fx991"].map(tag => (
                                    <button 
                                        key={tag}
                                        onClick={() => { setQuery(tag); handleSearch(tag); }}
                                        className="px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-[11px] font-black text-slate-600 hover:border-indigo-400 hover:text-indigo-600 active:scale-95 transition-all shadow-sm flex items-center gap-2"
                                    >
                                        {tag}
                                        <ArrowUpLeft className="w-3 h-3 text-slate-300 opacity-40 rotate-90" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{results.length} items found</p>
                            <div className="flex items-center gap-2">
                                <SaveSearchButton query={query} filters={filters} />
                                <button onClick={() => { setSearched(false); setResults([]); }} className="text-[10px] font-black text-indigo-500 uppercase px-2 py-1 bg-indigo-50 rounded-lg">Clear</button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {results.map(item => (
                                <div key={item.id} onClick={() => router.push(`/rentals/${item.id}`)} className="cursor-pointer">
                                    <RentalCard item={item} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
            <BottomNav />
        </div>
    );
}
