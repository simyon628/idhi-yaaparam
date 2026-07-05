"use client";

import { useCollege } from "@/contexts/CollegeContext";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import {
    Plus,
    X,
    Search as SearchIcon,
    ChevronRight,
    Camera,
    Mic,
    ArrowRight,
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useListingMode } from "@/lib/hooks/useListingMode";
import { prefetchRentals } from "@/lib/cache/itemsCache";
import { ProductCard } from "@/components/ui/ProductCard";
import { useAllItems } from "@/lib/hooks/useAllItems";
import { useSearchStore } from "@/stores/searchStore";
import { CategoryGrid } from "@/components/ui/CategoryGrid";

// Category Data by Mode
const CATEGORIES = {
    rent: [
        { id: "calculator", name: "Calculators", bg: "#EEF0FF", icon: "🖩" },
        { id: "lab-coat", name: "Lab Coats", bg: "#EAF3DE", icon: "🥼" },
        { id: "laptop", name: "Laptops", bg: "#E6F1FB", icon: "💻" },
        { id: "camera", name: "Cameras", bg: "#FBEAF0", icon: "📷" },
        { id: "geometry", name: "Geometry Kits", bg: "#FAEEDA", icon: "📏" },
        { id: "cycle", name: "Cycles", bg: "#E1F5EE", icon: "🚲" },
        { id: "project-kit", name: "Project Kits", bg: "#EAF3DE", icon: "🔬" },
        { id: "drafter", name: "Drafters", bg: "#E1F5EE", icon: "📐" },
    ],
    buy: [
        { id: "assignments", name: "Assignments", bg: "#EEF0FF", icon: "📝" },
        { id: "records", name: "Records", bg: "#EAF3DE", icon: "📋" },
        { id: "notes", name: "Notes", bg: "#E6F1FB", icon: "📚" },
        { id: "lab-manuals", name: "Lab Manuals", bg: "#FAEEDA", icon: "📓" },
        { id: "printouts", name: "Printouts", bg: "#FBEAF0", icon: "🖨️" },
        { id: "resume-writing", name: "Resume", bg: "#E1F5EE", icon: "📄" },
        { id: "mini-projects", name: "Mini Projects", bg: "#E6F1FB", icon: "💻" },
        { id: "ppt-design", name: "PPT Design", bg: "#EEF0FF", icon: "📊" },
    ],
    sell: [
        { id: "mobiles", name: "Mobiles", bg: "#EEF0FF", icon: "📱" },
        { id: "laptops", name: "Laptops", bg: "#E6F1FB", icon: "💻" },
        { id: "books", name: "Books", bg: "#EAF3DE", icon: "📚" },
        { id: "bikes", name: "Bikes", bg: "#FAEEDA", icon: "🏍️" },
        { id: "furniture", name: "Furniture", bg: "#E1F5EE", icon: "🪑" },
        { id: "electronics", name: "Electronics", bg: "#FBEAF0", icon: "🔌" },
        { id: "accessories", name: "Accessories", bg: "#E6F1FB", icon: "🎧" },
        { id: "hostel-essentials", name: "Hostel Needs", bg: "#FAEEDA", icon: "📦" },
    ]
};

// Promotional Banners Carousel Data
const PROMO_BANNERS = [
    {
        id: "sell-banner",
        mode: "sell",
        title: "Buy & Sell Student Essentials",
        subtitle: "Electronics, books & campus items",
        cta: "Shop Now",
        bg: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)"
    },
    {
        id: "rent-banner",
        mode: "rent",
        title: "Rent Smarter on Campus",
        subtitle: "Lab coats, calculators & laptops from students",
        cta: "Explore Rentals",
        bg: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)"
    },
    {
        id: "writing-banner",
        mode: "buy",
        title: "Assignment Help & Writing",
        subtitle: "Records, notes & project writing",
        cta: "Explore Writing",
        bg: "linear-gradient(135deg, #10B981 0%, #059669 100%)"
    }
];

// Personalized Recommendation Data
const STILL_LOOKING = {
    rent: ["Calculator", "Lab Coat", "Laptop"],
    buy: ["Assignment Help", "Record Writing"],
    sell: ["Mobile", "Books"]
};

export default function RentalsMarketplace() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { selectedCollege, isReady } = useCollege();
    const { listingMode: contextMode, setListingMode } = useListingMode();
    const urlType = searchParams.get("type") as "rent" | "buy" | "sell" | null;
    const activeMode = urlType || contextMode || "rent";

    // Real-time Firestore items
    const { data: allItems = [], isLoading: isItemsLoading } = useAllItems(selectedCollege?.id);

    // Search Store controls for sticky search bar
    const { open: openSearch, setQuery, executeSearch, query: storeQuery } = useSearchStore();
    const [searchInputVal, setSearchInputVal] = useState("");

    // Sync input value with store query
    useEffect(() => {
        setSearchInputVal(storeQuery);
    }, [storeQuery]);

    // Custom Local State
    const [carouselIndex, setCarouselIndex] = useState(0);

    // Filter items based on mode
    const rentItems = allItems.filter(item => item.listingType === "rent" || !item.listingType);
    const sellItems = allItems.filter(item => item.listingType === "sell");

    // Sort rent items by createdAt desc for recentItems (Fresh Today)
    const recentItems = [...rentItems].sort((a, b) => {
        const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : (a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date().getTime());
        const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : (b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date().getTime());
        return timeB - timeA;
    });

    // Auto-cycle banner carousel
    useEffect(() => {
        const timer = setInterval(() => {
            setCarouselIndex((prev) => (prev + 1) % PROMO_BANNERS.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    // Warm cache immediately when home loads
    useEffect(() => {
        if (db && selectedCollege?.id) {
            prefetchRentals(db as any, selectedCollege.id);
        }
    }, [selectedCollege?.id]);

    if (!isReady) return null;

    const handleFabClick = () => {
        if (!auth?.currentUser) {
            router.push("/login?redirect=/rentals/new");
        } else {
            router.push(`/rentals/new?type=${activeMode}`);
        }
    };

    const handleModeChange = (m: "rent" | "buy" | "sell") => {
        setListingMode(m);
        const params = new URLSearchParams(searchParams);
        params.set("type", m);
        router.replace(`/rentals?${params.toString()}`, { scroll: false });
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchInputVal.trim()) {
            setQuery(searchInputVal);
            executeSearch(searchInputVal, router);
        }
    };

    const getSearchPlaceholder = () => {
        if (activeMode === "rent") return "Search calculators, lab coats, laptops...";
        if (activeMode === "buy") return "Search assignments, records, notes...";
        return "Search electronics, books, bikes...";
    };

    /* ── Tab config ── */
    const TABS = [
        { id: "rent", label: "Rentals", icon: "🏷️" },
        { id: "buy", label: "Writing", icon: "✏️" },
        { id: "sell", label: "Buy & Sell", icon: "💰" },
    ] as const;

    return (
        <div
            className="flex flex-col min-h-screen pb-28"
            style={{ background: "var(--iy-surface)", fontFamily: "'DM Sans', sans-serif" }}
        >
            {/* ── SERVICE SWITCHER TABS (At the very top) ── */}
            <div className="px-4 py-3 bg-white flex gap-3 overflow-x-auto no-scrollbar relative z-20 border-b border-slate-100">
                {TABS.map((tab) => {
                    const isOn = activeMode === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => handleModeChange(tab.id as "rent" | "buy" | "sell")}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 6,
                                padding: "8px 16px",
                                borderRadius: "100px",
                                fontSize: "12px",
                                fontWeight: isOn ? 850 : 600,
                                cursor: "pointer",
                                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                border: "none",
                                flex: 1,
                                flexShrink: 0,
                                fontFamily: "'DM Sans', sans-serif",
                                ...(isOn
                                    ? { background: "#5B4CDB", color: "#fff", boxShadow: "0 4px 14px rgba(91,76,219,0.35)" }
                                    : { background: "rgba(0,0,0,0.04)", color: "rgba(0,0,0,0.56)" }
                                ),
                            }}
                        >
                            <span style={{ fontSize: 13 }}>{tab.icon}</span>
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* ── HEADER (TopBar) in clean LightMode ── */}
            <TopBar hideSearch={true} lightMode={true} />

            {/* ── SEARCH BAR ── */}
            <div className="px-4 py-2 border-b border-slate-100 bg-white">
                <form onSubmit={handleSearchSubmit} className="relative flex items-center bg-slate-50 border border-slate-200/80 rounded-xl overflow-hidden pr-1">
                    <button type="submit" className="p-3 text-slate-400 hover:text-indigo-600 transition-colors">
                        <SearchIcon className="w-4 h-4" />
                    </button>
                    <input 
                        type="text" 
                        value={searchInputVal}
                        onChange={(e) => {
                            setSearchInputVal(e.target.value);
                            setQuery(e.target.value);
                        }}
                        onClick={openSearch}
                        placeholder={getSearchPlaceholder()}
                        className="flex-1 bg-transparent border-none outline-none font-bold text-xs py-3 text-slate-800 placeholder-slate-400"
                    />
                    <div className="flex items-center gap-1">
                        <button type="button" className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                            <Camera className="w-4 h-4" />
                        </button>
                        <button type="button" className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                            <Mic className="w-4 h-4" />
                        </button>
                    </div>
                </form>
            </div>

            {/* ── CATEGORY SECTION ── */}
            <section style={{ padding: '12px 16px 4px', background: "#fff", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", gap: 10, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 4, margin: "0 -16px", padding: "0 16px" }} className="no-scrollbar">
                    {CATEGORIES[activeMode].map(cat => (
                        <div 
                            key={cat.id} 
                            onClick={() => router.push(`/category/${cat.id}`)} 
                            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer", flexShrink: 0 }}
                        >
                            <div style={{ width: 50, height: 50, borderRadius: "50%", background: cat.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, boxShadow: "inset 0 -2px 6px rgba(0,0,0,0.03)" }}>
                                {cat.icon}
                            </div>
                            <span style={{ fontSize: 9, fontWeight: 700, color: "var(--iy-text1)", textAlign: "center", lineHeight: 1.1, width: 54, wordWrap: "break-word" }}>{cat.name}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── PROMO CAROUSEL ── */}
            <div className="px-4 py-3 bg-white">
                <div className="relative overflow-hidden rounded-[20px] shadow-sm" style={{ aspectRatio: "25/8" }}>
                    {PROMO_BANNERS.map((banner, index) => {
                        const isCurrent = index === carouselIndex;
                        return (
                            <div
                                key={banner.id}
                                className="absolute inset-0 p-5 flex flex-col justify-between text-white transition-opacity duration-700 ease-in-out"
                                style={{ 
                                    background: banner.bg,
                                    opacity: isCurrent ? 1 : 0,
                                    pointerEvents: isCurrent ? "auto" : "none",
                                    zIndex: isCurrent ? 10 : 0
                                }}
                            >
                                <div className="space-y-1">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-white/70">PROMOTION</span>
                                    <h3 className="font-extrabold text-base tracking-tight text-white leading-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
                                        {banner.title}
                                    </h3>
                                    <p className="text-[10px] text-white/80 font-medium">{banner.subtitle}</p>
                                </div>
                                <div>
                                    <button 
                                        onClick={() => handleModeChange(banner.mode as "rent" | "buy" | "sell")}
                                        className="bg-white/20 backdrop-blur-md hover:bg-white/30 transition-colors text-white font-extrabold text-[10px] px-4 py-1.5 rounded-lg flex items-center gap-1.5"
                                    >
                                        {banner.cta} <ArrowRight className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    {/* Carousel Dots */}
                    <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-20">
                        {PROMO_BANNERS.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCarouselIndex(i)}
                                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === carouselIndex ? "w-4 bg-white" : "bg-white/40"}`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* ── MAIN CONTENT ── */}
            <div style={{ flex: 1, padding: "16px", display: "flex", flexDirection: "column", gap: 24 }}>
                {/* Rentals tab content */}
                {activeMode === "rent" && (
                    <div className="iy-fu1" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                        {/* Trending Shelf (Moved Up) */}
                        <section style={{ padding: '0 16px', margin: '0 -16px 24px', overflow: 'hidden' }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, padding: "0 16px" }}>
                                <div style={{ fontSize: 16, fontWeight: 600 }}>Trending 🔥</div>
                                <button onClick={() => router.push("/search")} style={{ fontSize: 12, fontWeight: 700, color: "#5B4CDB", background: "none", border: "none", cursor: "pointer" }}>
                                    See all →
                                </button>
                            </div>
                            <div style={{ display: "flex", gap: 10, overflowX: "auto", scrollbarWidth: "none", padding: "0 16px 4px" }}>
                                {(() => {
                                  const MOCK_TRENDING = [
                                    { id: "t1", itemName: "Scientific Calculator Casio", pricePerHour: 15, category: "calculator", branch: "CSE", distance: "0.2 km", sellerUsername: "rahul_svec", imageUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&q=80" },
                                    { id: "t2", itemName: "Engineering Drafter", pricePerHour: 25, category: "drafter", branch: "Mech", distance: "1.2 km", sellerUsername: "vikas_svec", imageUrl: "https://images.unsplash.com/photo-1503387837-b154d5074bd2?w=400&q=80" },
                                    { id: "t3", itemName: "Lab Coat White L", pricePerHour: 20, category: "lab-coat", branch: "Civil", distance: "0.5 km", sellerUsername: "sita_svec", imageUrl: "https://images.unsplash.com/photo-1581591524425-c7e0978865fc?w=400&q=80" },
                                  ];
                                  const combined = [...rentItems];
                                  MOCK_TRENDING.forEach(mock => {
                                    if (!combined.some(item => item.id === mock.id)) {
                                      combined.push(mock as any);
                                    }
                                  });
                                  return combined.map((item: any) => (
                                    <div key={item.id} onClick={() => router.push(`/rentals/${item.id}`)} style={{ cursor: "pointer" }}>
                                      <ProductCard 
                                        id={item.id}
                                        itemName={item.itemName}
                                        pricePerHour={item.pricePerHour}
                                        category={item.categoryId || item.category || "others"}
                                        branch={item.department || item.branch || "CSE"}
                                        sellerUsername={item.sellerUsername || "member"}
                                        distance={item.block || item.distance || "Campus"}
                                        imageUrl={item.photoUrl || item.imageUrl}
                                        variant="scroll" 
                                      />
                                    </div>
                                  ));
                                })()}
                            </div>
                        </section>

                        {/* Electronic & Gadgets */}
                        <section style={{ padding: '0 16px', margin: '0 -16px 24px', overflow: 'hidden' }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, padding: "0 16px" }}>
                                <div style={{ fontSize: 16, fontWeight: 600 }}>⚡ Electronic & Gadgets</div>
                                <button onClick={() => router.push("/category/electronics")} style={{ fontSize: 12, fontWeight: 700, color: "#5B4CDB", background: "none", border: "none", cursor: "pointer" }}>
                                    See all →
                                </button>
                            </div>
                            <div style={{ display: "flex", gap: 10, overflowX: "auto", scrollbarWidth: "none", padding: "0 16px 4px" }}>
                                {(() => {
                                  const MOCK_ELECTRONICS = [
                                    { id: "e1", itemName: "Scientific Calculator Casio", pricePerHour: 15, category: "calculator", branch: "CSE", distance: "0.2 km", sellerUsername: "rahul_svec" },
                                    { id: "e2", itemName: "MacBook Air M1", pricePerHour: 100, category: "laptop", branch: "CSE", distance: "0.6 km", sellerUsername: "priya_svec" },
                                    { id: "e3", itemName: "Canon DSLR Camera", pricePerHour: 50, category: "camera", branch: "ECE", distance: "1.0 km", sellerUsername: "anil_svec" },
                                  ];
                                  const realElectronics = rentItems.filter(item => ["electronics", "laptop", "camera", "calculator"].includes(item.categoryId || ""));
                                  const combined = [...realElectronics];
                                  MOCK_ELECTRONICS.forEach(mock => {
                                    if (!combined.some(item => item.id === mock.id)) {
                                      combined.push(mock as any);
                                    }
                                  });
                                  return combined.map((item: any) => (
                                    <div key={item.id} onClick={() => router.push(`/rentals/${item.id}`)} style={{ cursor: "pointer" }}>
                                      <ProductCard 
                                        id={item.id}
                                        itemName={item.itemName}
                                        pricePerHour={item.pricePerHour}
                                        category={item.categoryId || item.category || "others"}
                                        branch={item.department || item.branch || "CSE"}
                                        sellerUsername={item.sellerUsername || "member"}
                                        distance={item.block || item.distance || "Campus"}
                                        imageUrl={item.photoUrl || item.imageUrl}
                                        variant="scroll" 
                                      />
                                    </div>
                                  ));
                                })()}
                            </div>
                        </section>

                        {/* Academic & Tools */}
                        <section style={{ padding: '0 16px', margin: '0 -16px 24px', overflow: 'hidden' }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, padding: "0 16px" }}>
                                <div style={{ fontSize: 16, fontWeight: 600 }}>📐 Academic & Tools</div>
                                <button onClick={() => router.push("/category/academic")} style={{ fontSize: 12, fontWeight: 700, color: "#5B4CDB", background: "none", border: "none", cursor: "pointer" }}>
                                    See all →
                                </button>
                            </div>
                            <div style={{ display: "flex", gap: 10, overflowX: "auto", scrollbarWidth: "none", padding: "0 16px 4px" }}>
                                {(() => {
                                  const MOCK_ACADEMIC = [
                                    { id: "a1", itemName: "Engineering Drafter", pricePerHour: 25, category: "drafter", branch: "Mech", distance: "1.2 km", sellerUsername: "vikas_svec" },
                                    { id: "a2", itemName: "Lab Coat White L", pricePerHour: 20, category: "lab-coat", branch: "Civil", distance: "0.5 km", sellerUsername: "sita_svec" },
                                    { id: "a3", itemName: "Geometry Box set", pricePerHour: 10, category: "geometry", branch: "Mech", distance: "0.8 km", sellerUsername: "ram_svec" },
                                  ];
                                  const realAcademic = rentItems.filter(item => ["drafter", "lab-coat", "geometry", "books", "others"].includes(item.categoryId || ""));
                                  const combined = [...realAcademic];
                                  MOCK_ACADEMIC.forEach(mock => {
                                    if (!combined.some(item => item.id === mock.id)) {
                                      combined.push(mock as any);
                                    }
                                  });
                                  return combined.map((item: any) => (
                                    <div key={item.id} onClick={() => router.push(`/rentals/${item.id}`)} style={{ cursor: "pointer" }}>
                                      <ProductCard 
                                        id={item.id}
                                        itemName={item.itemName}
                                        pricePerHour={item.pricePerHour}
                                        category={item.categoryId || item.category || "others"}
                                        branch={item.department || item.branch || "CSE"}
                                        sellerUsername={item.sellerUsername || "member"}
                                        distance={item.block || item.distance || "Campus"}
                                        imageUrl={item.photoUrl || item.imageUrl}
                                        variant="scroll" 
                                      />
                                    </div>
                                  ));
                                })()}
                            </div>
                        </section>

                        {/* Near You Shelf */}
                        <section style={{ padding: '0 16px', margin: '0 -16px 24px', overflow: 'hidden' }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, padding: "0 16px" }}>
                                <div style={{ fontSize: 16, fontWeight: 600 }}>Near You 📍</div>
                                <button onClick={() => router.push("/near-you")} style={{ fontSize: 12, fontWeight: 700, color: "#5B4CDB", background: "none", border: "none", cursor: "pointer" }}>
                                    See all →
                                </button>
                            </div>
                            <div style={{ display: "flex", gap: 10, overflowX: "auto", scrollbarWidth: "none", padding: "0 16px 4px" }}>
                                {(() => {
                                  const MOCK_NEAR_YOU = [
                                    { id: "n1", itemName: "Casio fx-991EX", pricePerHour: 15, category: "calculator", branch: "CSE", distance: "0.2 km", sellerUsername: "rahul_svec", imageUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&q=80" },
                                    { id: "n2", itemName: "Mini Drafter", pricePerHour: 20, category: "drafter", branch: "Mech", distance: "0.4 km", sellerUsername: "anil_svec", imageUrl: "https://images.unsplash.com/photo-1503387837-b154d5074bd2?w=400&q=80" },
                                    { id: "n3", itemName: "Lab Coat", pricePerHour: 15, category: "lab-coat", branch: "Bio", distance: "0.5 km", sellerUsername: "priya_svec", imageUrl: "https://images.unsplash.com/photo-1581591524425-c7e0978865fc?w=400&q=80" },
                                  ];
                                  const combined = [...rentItems];
                                  MOCK_NEAR_YOU.forEach(mock => {
                                    if (!combined.some(item => item.id === mock.id)) {
                                      combined.push(mock as any);
                                    }
                                  });
                                  return combined.map((item: any) => (
                                    <div key={item.id} onClick={() => router.push(`/rentals/${item.id}`)} style={{ cursor: "pointer" }}>
                                      <ProductCard 
                                        id={item.id}
                                        itemName={item.itemName}
                                        pricePerHour={item.pricePerHour}
                                        category={item.categoryId || item.category || "others"}
                                        branch={item.department || item.branch || "CSE"}
                                        sellerUsername={item.sellerUsername || "member"}
                                        distance={item.block || item.distance || "Campus"}
                                        imageUrl={item.photoUrl || item.imageUrl}
                                        variant="scroll" 
                                      />
                                    </div>
                                  ));
                                })()}
                            </div>
                        </section>

                        {/* Fresh Today Shelf */}
                        {recentItems.length > 0 && (
                            <div>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                                    <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 17, color: "var(--iy-text1)" }}>Fresh Today</div>
                                    <button onClick={() => router.push("/search")} style={{ fontSize: 12, fontWeight: 700, color: "var(--iy-primary)", background: "none", border: "none", cursor: "pointer" }}>
                                        See all →
                                    </button>
                                </div>
                                <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
                                    {recentItems.map((item: any) => (
                                        <div key={item.id} onClick={() => router.push(`/rentals/${item.id}`)} style={{ cursor: "pointer" }}>
                                            <ProductCard 
                                              id={item.id}
                                              itemName={item.itemName}
                                              pricePerHour={item.pricePerHour}
                                              category={item.categoryId || item.category || "others"}
                                              branch={item.department || item.branch || "CSE"}
                                              sellerUsername={item.sellerUsername || "member"}
                                              distance={item.block || item.distance || "Campus"}
                                              imageUrl={item.photoUrl || item.imageUrl}
                                              variant="scroll" 
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Social Proof row */}
                        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", borderRadius: 16, padding: "14px 16px", boxShadow: "var(--iy-sh-card)" }}>
                            <div style={{ display: "flex" }}>
                                {[{ l: "S", bg: "linear-gradient(135deg,#5548E8,#7B72FF)" }, { l: "R", bg: "linear-gradient(135deg,#00C48C,#00A876)" }, { l: "A", bg: "linear-gradient(135deg,#FF9500,#FF7A00)" }, { l: "K", bg: "linear-gradient(135deg,#FF6B6B,#FF4444)" }].map(av => (
                                    <div key={av.l} style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", marginRight: -8, fontFamily: "'Syne',sans-serif", background: av.bg }}>{av.l}</div>
                                ))}
                            </div>
                            <div style={{ marginLeft: 16, flex: 1 }}>
                                <strong style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, color: "var(--iy-text1)", display: "block" }}>320 students active</strong>
                                <small style={{ fontSize: 11, color: "var(--iy-text3)" }}>Saving money on {selectedCollege?.acronym || "your"} campus</small>
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#FF9500", fontFamily: "'Syne',sans-serif", display: "flex", alignItems: "center", gap: 3 }}>⭐ 4.8</div>
                        </div>

                        {/* How It Works */}
                        <div>
                            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 17, color: "var(--iy-text1)", marginBottom: 12 }}>How It Works</div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                                {[
                                    { n: "1", ic: "🔍", lb: "Find what you need" },
                                    { n: "2", ic: "💬", lb: "Message owner" },
                                    { n: "3", ic: "✅", lb: "Pick up & return" }
                                ].map(s => (
                                    <div key={s.n} style={{ background: "#fff", borderRadius: 16, padding: "16px 10px", textAlign: "center", boxShadow: "var(--iy-sh-card)" }}>
                                        <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--iy-primary-light)", color: "var(--iy-primary)", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>{s.n}</div>
                                        <div style={{ fontSize: 20, marginBottom: 6 }}>{s.ic}</div>
                                        <div style={{ fontSize: 10, fontWeight: 600, color: "var(--iy-text2)", lineHeight: 1.3 }}>{s.lb}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Campus For You */}
                        {selectedCollege && (
                            <div>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                                    <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 17, color: "var(--iy-text1)" }}>Campus Stats</div>
                                </div>
                                <div style={{ background: "#13131F", color: "#fff", padding: "20px", borderRadius: 24, position: "relative", overflow: "hidden" }}>
                                    <div style={{ position: "absolute", top: -40, right: -20, width: 150, height: 150, background: "radial-gradient(circle,rgba(85,72,232,0.3) 0%,transparent 70%)" }} />
                                    <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 18, color: "#fff", marginBottom: 4, position: "relative", zIndex: 1 }}>🎓 {selectedCollege.name}</h3>
                                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 16, position: "relative", zIndex: 1 }}>Active student marketplace</p>

                                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", position: "relative", zIndex: 1 }}>
                                        <div style={{ background: "var(--iy-primary-light)", color: "var(--iy-primary)", fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 20 }}>📊 Analytics Mode Active</div>
                                        <div style={{ background: "var(--iy-emerald-light)", color: "#007A55", fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 20 }}>⚡ Live Rentals Supported</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Writing tab content */}
                {activeMode === "buy" && (
                    <WritingSection router={router} />
                )}

                {/* Buy & Sell tab content */}
                {activeMode === "sell" && (
                    <BuySellSection router={router} sellItems={sellItems} />
                )}
            </div>



            <BottomNav />
        </div>
    );
}

/* ── Writing Section ── */
function WritingSection({ router }: { router: any }) {
    return (
        <div className="iy-fu1 flex flex-col gap-5">
            {/* Earn card */}
            <div
                style={{
                    background: "#13131F",
                    borderRadius: 28,
                    padding: "22px 20px",
                    position: "relative",
                    overflow: "hidden",
                    cursor: "pointer",
                }}
                onClick={() => router.push("/writing")}
            >
                <div style={{ position: "absolute", top: -40, right: -20, width: 160, height: 160, background: "radial-gradient(circle,rgba(0,196,140,.28) 0%,transparent 70%)" }} />
                <div style={{ position: "absolute", bottom: -30, left: -10, width: 130, height: 130, background: "radial-gradient(circle,rgba(85,72,232,.22) 0%,transparent 70%)" }} />
                <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(0,196,140,.14)", border: "1px solid rgba(0,196,140,.22)", borderRadius: 20, padding: "4px 11px", fontSize: 11, fontWeight: 700, color: "#00C48C", letterSpacing: ".5px", marginBottom: 12, position: "relative", zIndex: 1 }}>
                    ✨ EARN MONEY
                </div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 22, color: "#fff", lineHeight: 1.2, marginBottom: 8, position: "relative", zIndex: 1 }}>
                    Write & <span style={{ color: "#00C48C" }}>Earn</span><br />on Free Time
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,.48)", lineHeight: 1.55, marginBottom: 18, position: "relative", zIndex: 1 }}>
                    Lab records, assignments, project reports. Get paid per completed job. Work anytime — holidays, free periods, weekends. No fixed schedule.
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18, position: "relative", zIndex: 1 }}>
                    {["📋 Lab Records", "📝 Assignments", "📊 Reports"].map((t) => (
                        <span key={t} style={{ background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 20, padding: "5px 12px", fontSize: 11, color: "rgba(255,255,255,.6)", fontWeight: 500 }}>{t}</span>
                    ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
                    <div>
                        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 700, color: "#00C48C" }}>₹200–500 <span style={{ fontSize: 12, fontWeight: 400, color: "rgba(255,255,255,.4)", fontFamily: "'DM Sans',sans-serif" }}>/job</span></div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,.3)", marginTop: 3 }}>⭐⭐⭐⭐⭐ 4.9 · 180 active writers</div>
                    </div>
                </div>
                <button
                    style={{ background: "linear-gradient(135deg,#00C48C,#00A876)", color: "#fff", fontSize: 13, fontWeight: 700, padding: "11px 20px", borderRadius: 12, border: "none", cursor: "pointer", boxShadow: "0 6px 22px rgba(0,196,140,.38)", width: "100%", marginTop: 16 }}
                    onClick={(e) => { e.stopPropagation(); router.push("/writing"); }}
                >
                    Start Earning →
                </button>
            </div>

            {/* Social Proof for Writing */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", borderRadius: 16, padding: "14px 16px", boxShadow: "var(--iy-sh-card)" }}>
                <div style={{ display: "flex" }}>
                    {[{ l: "S", bg: "linear-gradient(135deg,#5548E8,#7B72FF)" }, { l: "R", bg: "linear-gradient(135deg,#00C48C,#00A876)" }, { l: "A", bg: "linear-gradient(135deg,#FF9500,#FF7A00)" }, { l: "K", bg: "linear-gradient(135deg,#FF6B6B,#FF4444)" }].map(av => (
                        <div key={av.l} style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", marginRight: -8, fontFamily: "'Syne',sans-serif", background: av.bg }}>{av.l}</div>
                    ))}
                </div>
                <div style={{ marginLeft: 16, flex: 1 }}>
                    <strong style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, color: "var(--iy-text1)", display: "block" }}>320 writers earning this week</strong>
                    <small style={{ fontSize: 11, color: "var(--iy-text3)" }}>Average ₹380/job · Work on free time</small>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#FF9500", fontFamily: "'Syne',sans-serif", display: "flex", alignItems: "center", gap: 3 }}>⭐ 4.9</div>
            </div>
        </div>
    );
}

/* ── Buy & Sell Section ── */
function BuySellSection({ router, sellItems }: { router: any; sellItems: any[] }) {
    return (
        <div className="iy-fu1 flex flex-col gap-4">

            {/* Browse categories for buy/sell */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 17, color: "var(--iy-text1)" }}>Browse Items</div>
                <button onClick={() => router.push("/search")} style={{ fontSize: 12, fontWeight: 700, color: "var(--iy-primary)", background: "none", border: "none", cursor: "pointer" }}>
                    View all →
                </button>
            </div>

            <CategoryGrid />

            {/* Real items for sale grid */}
            {sellItems.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 17, color: "var(--iy-text1)", marginBottom: 4 }}>Available on Campus 💰</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, justifyItems: "center" }}>
                        {sellItems.map(item => (
                            <div key={item.id} onClick={() => router.push(`/rentals/${item.id}`)} style={{ cursor: "pointer", width: "100%", display: "flex", justifyContent: "center" }}>
                                <ProductCard 
                                    id={item.id}
                                    itemName={item.itemName}
                                    pricePerHour={item.pricePerHour}
                                    category={item.categoryId || "others"}
                                    branch={item.department || "CSE"}
                                    sellerUsername="member"
                                    distance={item.block || "Campus"}
                                    imageUrl={item.photoUrl}
                                    variant="grid"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                /* Empty/placeholder state — sell */
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 17, color: "var(--iy-text1)", marginBottom: 4 }}>Your Listings</div>
                    <div style={{ background: "#fff", borderRadius: 24, boxShadow: "var(--iy-sh-card)", padding: "32px 20px", textAlign: "center" as const }}>
                        <div style={{ fontSize: 42, marginBottom: 12 }}>📦</div>
                        <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16, color: "var(--iy-text1)", marginBottom: 6 }}>No Listings Yet</div>
                        <div style={{ fontSize: 12, color: "var(--iy-text3)", lineHeight: 1.5, marginBottom: 16 }}>
                            List your used items and earn money from fellow students on campus.
                        </div>
                        <button
                            onClick={() => router.push("/rentals/new?type=sell")}
                            style={{ background: "linear-gradient(135deg,#FF9500,#FF7300)", color: "#fff", fontSize: 13, fontWeight: 700, padding: "12px 28px", borderRadius: 18, border: "none", cursor: "pointer", boxShadow: "0 6px 20px rgba(255,149,0,.35)" }}
                        >
                            + List Item to Sell
                        </button>
                    </div>
                </div>
            )}

            {/* How to sell */}
            <div style={{ marginTop: 12 }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 17, color: "var(--iy-text1)", marginBottom: 12 }}>How to Sell</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    {[
                        { n: "1", ic: "📷", lb: "Click a photo" },
                        { n: "2", ic: "💰", lb: "Set your price" },
                        { n: "3", ic: "🤝", lb: "Meet & collect cash" }
                    ].map(s => (
                        <div key={s.n} style={{ background: "#fff", borderRadius: 16, padding: "16px 10px", textAlign: "center", boxShadow: "var(--iy-sh-card)" }}>
                            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--iy-primary-light)", color: "var(--iy-primary)", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>{s.n}</div>
                            <div style={{ fontSize: 20, marginBottom: 6 }}>{s.ic}</div>
                            <div style={{ fontSize: 10, fontWeight: 600, color: "var(--iy-text2)", lineHeight: 1.3 }}>{s.lb}</div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}
