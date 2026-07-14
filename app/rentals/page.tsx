"use client";

import { useCollege } from "@/contexts/CollegeContext";
import { BottomNav } from "@/components/layout/BottomNav";
import {
    Plus,
    X,
    Search as SearchIcon,
    Camera,
    Mic,
    ArrowRight,
    Bell,
    ChevronDown,
    Calculator,
    Shirt,
    Laptop,
    Camera as CameraIcon,
    Ruler,
    BookOpen,
    FileText,
    ClipboardList,
    Book,
    Notebook,
    Printer,
    FileDown,
    Presentation,
    Smartphone,
    Headset,
    Package
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useListingMode } from "@/lib/hooks/useListingMode";
import { prefetchRentals } from "@/lib/cache/itemsCache";
import { ProductCard } from "@/components/ui/ProductCard";
import { useAllItems } from "@/lib/hooks/useAllItems";
import { useSearchStore } from "@/stores/searchStore";
import { CategoryGrid } from "@/components/ui/CategoryGrid";
import { theme } from "@/lib/theme.config";
import { useActiveBanners, getBannerGradient } from "@/lib/hooks/useActiveBanners";
import { InlineCollegeSelection } from "@/components/ui/InlineCollegeSelection";

// ── Responsive CSS variable shorthand ──
const PP = 20;

// Category Data by Mode
const CATEGORIES = {
    rent: [
        { id: "calculator", name: "Calculators", bg: "#EEF0FF", icon: <Calculator size={24} /> },
        { id: "drafter", name: "Drafters", bg: "#FAEEDA", icon: <Ruler size={24} /> },
        { id: "lab-coat", name: "Lab Coats", bg: "#E1F5EE", icon: <Shirt size={24} /> },
        { id: "laptop", name: "Laptops", bg: "#E6F1FB", icon: <Laptop size={24} /> },
        { id: "camera", name: "Cameras", bg: "#FBEAF0", icon: <CameraIcon size={24} /> },
        { id: "books", name: "Books", bg: "#E1F5EE", icon: <BookOpen size={24} /> },
        { id: "hostel", name: "Hostel Essentials", bg: "#FAEEDA", icon: <Package size={24} /> },
        { id: "accessories", name: "Laptop Accessories", bg: "#E6F1FB", icon: <Headset size={24} /> },
    ],
    buy: [
        { id: "assignments", name: "Assignments", bg: "#EEF0FF", icon: <FileText size={24} /> },
        { id: "records", name: "Records", bg: "#EAF3DE", icon: <ClipboardList size={24} /> },
        { id: "notes", name: "Notes", bg: "#E6F1FB", icon: <Book size={24} /> },
        { id: "lab-manuals", name: "Lab Manuals", bg: "#FAEEDA", icon: <Notebook size={24} /> },
        { id: "printouts", name: "Printouts", bg: "#FBEAF0", icon: <Printer size={24} /> },
        { id: "resume-writing", name: "Resume", bg: "#E1F5EE", icon: <FileDown size={24} /> },
        { id: "mini-projects", name: "Mini Projects", bg: "#E6F1FB", icon: <Laptop size={24} /> },
        { id: "ppt-design", name: "PPT Design", bg: "#EEF0FF", icon: <Presentation size={24} /> },
    ],
    sell: [
        { id: "mobiles", name: "Mobiles", bg: "#EEF0FF", icon: <Smartphone size={24} /> },
        { id: "laptops", name: "Laptops", bg: "#E6F1FB", icon: <Laptop size={24} /> },
        { id: "books", name: "Books", bg: "#EAF3DE", icon: <Book size={24} /> },
        { id: "bikes", name: "Bikes", bg: "#FAEEDA", icon: <Package size={24} /> },
        { id: "furniture", name: "Furniture", bg: "#E1F5EE", icon: <Package size={24} /> },
        { id: "electronics", name: "Electronics", bg: "#FBEAF0", icon: <Laptop size={24} /> },
        { id: "accessories", name: "Accessories", bg: "#E6F1FB", icon: <Headset size={24} /> },
        { id: "hostel-essentials", name: "Hostel Needs", bg: "#FAEEDA", icon: <Package size={24} /> },
    ]
};

const MOCK_TRENDING = [
    { id: "t1", itemName: "Scientific Calculator Casio fx-991EX", pricePerHour: 15, category: "calculator", branch: "CSE", distance: "0.2 km", sellerUsername: "rahul_svec", imageUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&q=80" },
    { id: "t2", itemName: "Engineering Drafter set", pricePerHour: 25, category: "drafter", branch: "Mech", distance: "1.2 km", sellerUsername: "vikas_svec", imageUrl: "https://images.unsplash.com/photo-1503387837-b154d5074bd2?w=400&q=80" },
    { id: "t3", itemName: "Lab Coat White Large size", pricePerHour: 20, category: "lab-coat", branch: "Civil", distance: "0.5 km", sellerUsername: "sita_svec", imageUrl: "https://images.unsplash.com/photo-1581591524425-c7e0978865fc?w=400&q=80" },
    { id: "t4", itemName: "MacBook Pro M2 16GB", pricePerHour: 120, category: "laptop", branch: "CSE", distance: "0.8 km", sellerUsername: "ram_svec", imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80" },
    { id: "t5", itemName: "Canon DSLR Camera 80D", pricePerHour: 60, category: "camera", branch: "ECE", distance: "1.0 km", sellerUsername: "anil_svec", imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&q=80" },
    { id: "t6", itemName: "Hostel Study Lamp LED", pricePerHour: 8, category: "hostel-essentials", branch: "CSE", distance: "0.3 km", sellerUsername: "divya_svec", imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&q=80" },
    { id: "t7", itemName: "Gate CSE Preparation Book Set", pricePerHour: 10, category: "books", branch: "CSE", distance: "0.5 km", sellerUsername: "arun_svec", imageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80" },
    { id: "t8", itemName: "Bluetooth Headphones Noise Cancelling", pricePerHour: 30, category: "accessories", branch: "ECE", distance: "0.9 km", sellerUsername: "sanjay_svec", imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80" }
];

const MOCK_CALCULATORS = [
    { id: "mc1", itemName: "Scientific Calculator Casio fx-991EX", pricePerHour: 15, category: "calculator", branch: "CSE", distance: "0.2 km", sellerUsername: "rahul_svec" },
    { id: "mc2", itemName: "Casio fx-82MS Scientific Calculator", pricePerHour: 8, category: "calculator", branch: "Mech", distance: "0.4 km", sellerUsername: "anil_svec" },
    { id: "mc3", itemName: "Financial Calculator HP 10bII", pricePerHour: 20, category: "calculator", branch: "MBA", distance: "0.7 km", sellerUsername: "priya_svec" },
    { id: "mc4", itemName: "Casio fx-991CW Advanced Scientific", pricePerHour: 18, category: "calculator", branch: "ECE", distance: "0.3 km", sellerUsername: "deepak_svec" },
    { id: "mc5", itemName: "TI-84 Plus Graphing Calculator", pricePerHour: 25, category: "calculator", branch: "CSE", distance: "1.1 km", sellerUsername: "mohan_svec" },
    { id: "mc6", itemName: "Casio FX-CG50 Color Graphing", pricePerHour: 30, category: "calculator", branch: "Mech", distance: "0.6 km", sellerUsername: "lakshmi_svec" },
];

const MOCK_ELECTRONICS = [
    { id: "me1", itemName: "MacBook Pro M2 16GB", pricePerHour: 120, category: "laptop", branch: "CSE", distance: "0.8 km", sellerUsername: "ram_svec" },
    { id: "me2", itemName: "Canon DSLR Camera 80D", pricePerHour: 60, category: "camera", branch: "ECE", distance: "1.0 km", sellerUsername: "anil_svec" },
    { id: "me3", itemName: "Bluetooth Headphones Noise Cancelling", pricePerHour: 30, category: "accessories", branch: "ECE", distance: "0.9 km", sellerUsername: "sanjay_svec" },
    { id: "me4", itemName: "Arduino Uno Ultimate Starter Kit", pricePerHour: 15, category: "electronics", branch: "ECE", distance: "0.5 km", sellerUsername: "vijay_svec" },
    { id: "me5", itemName: "Raspberry Pi 4 Model B 8GB", pricePerHour: 20, category: "electronics", branch: "CSE", distance: "0.4 km", sellerUsername: "suresh_svec" },
    { id: "me6", itemName: "USB-C Hub 7-in-1 Adapter", pricePerHour: 10, category: "accessories", branch: "CSE", distance: "0.2 km", sellerUsername: "karthik_svec" },
];

const MOCK_BOOKS = [
    { id: "mb1", itemName: "Gate CSE Preparation Book Set", pricePerHour: 10, category: "books", branch: "CSE", distance: "0.5 km", sellerUsername: "arun_svec" },
    { id: "mb2", itemName: "Introduction to Algorithms (CLRS)", pricePerHour: 12, category: "books", branch: "CSE", distance: "0.2 km", sellerUsername: "kiran_svec" },
    { id: "mb3", itemName: "Engineering Physics Textbook", pricePerHour: 8, category: "books", branch: "First Year", distance: "0.6 km", sellerUsername: "meena_svec" },
    { id: "mb4", itemName: "Data Structures & Algorithms Made Easy", pricePerHour: 10, category: "books", branch: "CSE", distance: "0.3 km", sellerUsername: "naveen_svec" },
    { id: "mb5", itemName: "Operating Systems Concepts (Galvin)", pricePerHour: 12, category: "books", branch: "CSE", distance: "0.7 km", sellerUsername: "ravi_svec" },
    { id: "mb6", itemName: "Engineering Mathematics Vol 1 & 2", pricePerHour: 8, category: "books", branch: "First Year", distance: "0.4 km", sellerUsername: "priya2_svec" },
];

const MOCK_HOSTEL = [
    { id: "mh1", itemName: "Hostel Study Lamp LED", pricePerHour: 8, category: "hostel-essentials", branch: "CSE", distance: "0.3 km", sellerUsername: "divya_svec" },
    { id: "mh2", itemName: "Electric Kettle 1.5L", pricePerHour: 12, category: "hostel-essentials", branch: "Mech", distance: "0.4 km", sellerUsername: "prasad_svec" },
    { id: "mh3", itemName: "Pedestal Fan 3-Speed", pricePerHour: 15, category: "hostel-essentials", branch: "ECE", distance: "0.6 km", sellerUsername: "swetha_svec" },
    { id: "mh4", itemName: "Iron Box Steam Press", pricePerHour: 10, category: "hostel-essentials", branch: "CSE", distance: "0.2 km", sellerUsername: "ganesh_svec" },
    { id: "mh5", itemName: "Induction Cooktop Portable", pricePerHour: 18, category: "hostel-essentials", branch: "Mech", distance: "0.5 km", sellerUsername: "harish_svec" },
    { id: "mh6", itemName: "Mini Fridge 45L Compact", pricePerHour: 25, category: "hostel-essentials", branch: "ECE", distance: "0.8 km", sellerUsername: "pooja_svec" },
];

function ProductShelf({
    title,
    emoji = "",
    seeAllUrl,
    items,
    mockItems,
    router
}: {
    title: string;
    emoji?: string;
    seeAllUrl: string;
    items: any[];
    mockItems: any[];
    router: any;
}) {
    const combined = [...items];
    mockItems.forEach(mock => {
        if (!combined.some(item => item.id === mock.id)) {
            combined.push(mock);
        }
    });

    return (
        <section style={{ overflow: 'hidden' }}>
            {/* Section header — aligned to page padding */}
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                marginBottom: 14,
                paddingLeft: PP, paddingRight: PP,
            }}>
                <div style={{
                    fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
                    fontSize: "var(--iy-section-title, 18px)",
                    fontWeight: 700,
                    color: "#1e293b"
                }}>
                    {emoji && <span style={{ marginRight: 6 }}>{emoji}</span>}
                    {title}
                </div>
                <button
                    onClick={() => router.push(seeAllUrl)}
                    style={{
                        fontFamily: "var(--font-dm), 'DM Sans', sans-serif",
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#0B57D0",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                        gap: 2
                    }}
                >
                    See all →
                </button>
            </div>
            {/* Product scroll row — left padding aligned, right bleeds to edge */}
            <div
                style={{
                    display: "flex",
                    gap: 12,
                    overflowX: "auto",
                    scrollbarWidth: "none",
                    scrollSnapType: "x mandatory",
                    scrollBehavior: "smooth",
                    WebkitOverflowScrolling: "touch",
                    paddingLeft: PP,
                    paddingRight: PP,
                    paddingBottom: 4,
                }}
                className="no-scrollbar"
            >
                {combined.map((item: any) => (
                    <div
                        key={item.id}
                        onClick={() => router.push(`/rentals/${item.id}`)}
                        style={{ cursor: "pointer", flexShrink: 0, scrollSnapAlign: "start" }}
                    >
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
        </section>
    );
}

export default function RentalsMarketplace() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { selectedCollege, isReady } = useCollege();
    const { listingMode: contextMode, setListingMode } = useListingMode();
    const urlType = searchParams.get("type") as "rent" | "buy" | "sell" | null;
    const activeMode = urlType || contextMode || "rent";

    // Real-time Firestore items
    const { data: allItems = [], isLoading: isItemsLoading } = useAllItems(selectedCollege?.id);

    // Dynamic banners from Firestore (owner-managed)
    const { banners } = useActiveBanners();

    // Search Store controls for sticky search bar
    const { open: openSearch, setQuery, executeSearch, query: storeQuery } = useSearchStore();
    const [searchInputVal, setSearchInputVal] = useState("");

    // Sync input value with store query
    useEffect(() => {
        setSearchInputVal(storeQuery);
    }, [storeQuery]);

    // Custom Local State
    const [carouselIndex, setCarouselIndex] = useState(0);
    const [showCollegeModal, setShowCollegeModal] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const userId = auth?.currentUser?.uid;

    // Notification count
    useEffect(() => {
        if (!userId || !db) return;
        const q = query(
            collection(db as any, "notifications"),
            where("userId", "==", userId),
            where("isRead", "==", false)
        );
        const unsub = onSnapshot(q, (snap) => setUnreadCount(snap.size));
        return () => unsub();
    }, [userId]);

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
        if (banners.length === 0) return;
        const timer = setInterval(() => {
            setCarouselIndex((prev) => (prev + 1) % banners.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [banners.length]);

    // Warm cache immediately when home loads
    useEffect(() => {
        if (db && selectedCollege?.id) {
            prefetchRentals(db as any, selectedCollege.id);
        }
    }, [selectedCollege?.id]);

    useEffect(() => {
        if (selectedCollege) setShowCollegeModal(false);
    }, [selectedCollege]);

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

    const collegeName =
        selectedCollege?.acronym ||
        (selectedCollege?.name
            ? selectedCollege.name.split(" ").map((w: string) => w[0]).join("").toUpperCase()
            : "Campus");

    return (
        <div
            className="flex flex-col min-h-screen pb-28"
            style={{ background: "#ffffff", fontFamily: "'DM Sans', sans-serif" }}
        >
            {/* ══════════════════════════════════════════════════════════════
                HEADER SECTION — All elements start from --iy-page-padding
            ══════════════════════════════════════════════════════════════ */}
            <div style={{
                position: "relative",
                background: "#ffffff",
                paddingBottom: 0,
            }}>
                {/* Hero Fading Background — extended & smoother fade */}
                <div style={{
                    position: "absolute", top: 0, left: 0, right: 0, height: 400,
                    background: `linear-gradient(180deg, ${theme.header.background} 0%, rgba(248,250,252,0.5) 55%, rgba(255,255,255,0) 100%)`,
                    zIndex: 0, pointerEvents: "none",
                }}>
                    {/* Subtle white radial glow */}
                    <div style={{
                        position: "absolute", top: -50, left: "50%", transform: "translateX(-50%)",
                        width: 600, height: 600,
                        background: "radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 60%)",
                    }} />
                </div>

                {/* ── Three Mode Tabs ── */}
                <div style={{
                    display: "flex", gap: 8,
                    paddingTop: 14,
                    paddingLeft: PP, paddingRight: PP,
                    position: "relative", zIndex: 2,
                }}>
                    {TABS.map((tab) => {
                        const isOn = activeMode === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => handleModeChange(tab.id as "rent" | "buy" | "sell")}
                                style={{
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                                    padding: "8px 0", borderRadius: 12, fontSize: 12,
                                    fontWeight: isOn ? 800 : 600, cursor: "pointer", flex: 1,
                                    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)", border: "none",
                                    fontFamily: "'DM Sans', sans-serif",
                                    ...(isOn
                                        ? { background: theme.tab.activeBg, color: theme.tab.activeText, boxShadow: theme.tab.activeShadow }
                                        : { background: theme.tab.inactiveBg, color: theme.tab.inactiveText, border: `1px solid ${theme.tab.inactiveBorder}` }
                                    ),
                                }}
                            >
                                <span style={{ fontSize: 13 }}>{tab.icon}</span>
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* ── Top Row: Logo + Bell + College Chip ── */}
                <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    paddingTop: 16, paddingBottom: 0,
                    paddingLeft: PP, paddingRight: PP,
                    position: "relative", zIndex: 2,
                }}>
                    <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => router.push("/rentals")}>
                        <div style={{
                            width: 38, height: 38, background: theme.logo.iconBg, borderRadius: 12,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 20, boxShadow: theme.logo.iconShadow,
                        }}>
                            {theme.logo.emoji}
                        </div>
                        <div>
                            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 16, color: theme.header.textColor, lineHeight: 1 }}>Idhi Yaaparam</div>
                            <div style={{ fontSize: 10, color: theme.header.subtextColor, letterSpacing: "1.8px", textTransform: "uppercase", marginTop: 2 }}>Student Platform</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => router.push("/notifications")} style={{
                            width: 36, height: 36, background: theme.chip.bg, border: theme.chip.border,
                            borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer", position: "relative", fontSize: 16,
                        }}>
                            🔔
                            {unreadCount > 0 && (
                                <span style={{ position: "absolute", top: 7, right: 7, width: 7, height: 7, background: "#FF5F5F", borderRadius: "50%", border: `1.5px solid ${theme.brand.primary}` }} />
                            )}
                        </button>
                        <button onClick={() => setShowCollegeModal(true)} style={{
                            display: "flex", alignItems: "center", gap: 5, background: theme.chip.bg,
                            border: theme.chip.border, borderRadius: 20, padding: "6px 11px", cursor: "pointer",
                        }}>
                            <span className="iy-pulse-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: theme.chip.dotColor, flexShrink: 0, display: "inline-block" }} />
                            <span style={{ fontSize: 11, color: theme.chip.text, fontWeight: 600 }}>{collegeName}</span>
                            <ChevronDown style={{ width: 12, height: 12, color: "rgba(255,255,255,0.5)" }} />
                        </button>
                    </div>
                </div>

                {/* ── Search Bar ── */}
                <div style={{
                    paddingLeft: PP, paddingRight: PP,
                    position: "relative", zIndex: 2,
                    marginTop: 16,
                    marginBottom: 20,
                }}>
                    <form onSubmit={handleSearchSubmit} style={{
                        display: "flex", alignItems: "center", background: "#FFFFFF",
                        border: "1px solid #E5E7EB",
                        borderRadius: 18, height: 48, boxShadow: "0 2px 10px rgba(0,0,0,0.05)", overflow: "hidden", paddingRight: 4,
                    }}>
                        <button type="submit" style={{ padding: "0 12px 0 16px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}>
                            <SearchIcon style={{ width: 20, height: 20, color: "#4B5563" }} />
                        </button>
                        <input
                            type="text" value={searchInputVal}
                            onChange={(e) => { setSearchInputVal(e.target.value); setQuery(e.target.value); }}
                            onClick={openSearch} placeholder={getSearchPlaceholder()}
                            style={{
                                flex: 1, background: "transparent", border: "none", outline: "none",
                                fontWeight: 500, fontSize: 14, color: theme.header.searchText,
                                fontFamily: "'DM Sans', sans-serif",
                            }}
                        />
                        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                            <button type="button" style={{ padding: 8, background: "none", border: "none", cursor: "pointer" }}><Camera style={{ width: 16, height: 16, color: "#9CA3AF" }} /></button>
                            <button type="button" style={{ padding: 8, background: "none", border: "none", cursor: "pointer" }}><Mic style={{ width: 16, height: 16, color: "#9CA3AF" }} /></button>
                        </div>
                    </form>
                </div>

                {/* ── CATEGORY SECTION — left-aligned, scrolls to edge ── */}
                <section style={{ position: "relative", zIndex: 2, marginBottom: 20 }}>
                    <div style={{
                        display: "flex",
                        gap: 12,
                        overflowX: "auto",
                        scrollbarWidth: "none",
                        scrollSnapType: "x mandatory",
                        scrollBehavior: "smooth",
                        WebkitOverflowScrolling: "touch",
                        paddingLeft: PP,
                        paddingRight: PP,
                        paddingBottom: 4,
                    }} className="no-scrollbar">
                        {CATEGORIES[activeMode].map(cat => (
                            <div
                                key={cat.id}
                                onClick={() => router.push(`/category/${cat.id}`)}
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: 6,
                                    cursor: "pointer",
                                    flexShrink: 0,
                                    width: "calc((min(100vw, 448px) - 80px) / 5.5)",
                                    scrollSnapAlign: "start"
                                }}
                            >
                                <div style={{
                                    width: "var(--iy-cat-icon)",
                                    height: "var(--iy-cat-icon)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#4B5563",
                                    flexShrink: 0,
                                }}>
                                    {cat.icon}
                                </div>
                                <span className="cat-label">{cat.name}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── DYNAMIC CAROUSEL — aligned to page padding ── */}
                <div style={{
                    paddingLeft: PP, paddingRight: PP,
                    marginBottom: 24,
                    position: "relative", zIndex: 2,
                }}>
                    <div className="relative overflow-hidden shadow-lg" style={{ height: 200, width: "100%", borderRadius: 18 }}>
                        {banners.map((banner, index) => {
                            const isCurrent = index === carouselIndex;
                            return (
                                <div key={banner.id} className="absolute inset-0 flex flex-col justify-between text-white transition-opacity duration-700 ease-in-out"
                                    style={{
                                        background: banner.imageUrl ? `url(${banner.imageUrl}) center/cover no-repeat` : getBannerGradient(index),
                                        opacity: isCurrent ? 1 : 0, pointerEvents: isCurrent ? "auto" : "none", zIndex: isCurrent ? 10 : 0,
                                    }}>
                                    {banner.imageUrl && <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 100%)", zIndex: 0 }} />}
                                    <div style={{ position: "relative", zIndex: 1, padding: "20px 24px" }}>
                                        <div className="space-y-1.5">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">Special Offer</span>
                                            <h3 className="font-extrabold text-xl tracking-tight text-white leading-tight" style={{ fontFamily: "'Syne', sans-serif" }}>{banner.title}</h3>
                                            <p className="text-[11px] text-white/90 font-medium">{banner.subtitle}</p>
                                        </div>
                                        <div style={{ marginTop: 16 }}>
                                            <button onClick={() => banner.ctaLink && router.push(banner.ctaLink)} className="bg-white/25 backdrop-blur-md hover:bg-white/35 transition-colors text-white font-extrabold text-[11px] px-5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm border border-white/20">
                                                {banner.ctaText} <ArrowRight className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-20" style={{ bottom: 12 }}>
                            {banners.map((_, i) => (
                                <button key={i} onClick={() => setCarouselIndex(i)} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === carouselIndex ? "w-5 bg-white" : "bg-white/40"}`} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* College Selection Modal */}
            {showCollegeModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-5 animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl relative">
                        <div className="flex items-center justify-between p-5 border-b border-slate-100"
                            style={{ background: theme.brand.gradient }}>
                            <h2 className="text-lg font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
                                🎓 Change College
                            </h2>
                            <button
                                onClick={() => setShowCollegeModal(false)}
                                className="p-2 -mr-2 text-white/60 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-5 max-h-[70vh] overflow-y-auto">
                            <InlineCollegeSelection />
                        </div>
                    </div>
                </div>
            )}

            {/* ── MAIN CONTENT — sections with consistent spacing ── */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 28 }}>
                {/* Rentals tab content */}
                {activeMode === "rent" && (
                    <div className="iy-fu1" style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                        {/* 1. Trending Shelf */}
                        <ProductShelf
                            title="Trending"
                            emoji="🔥"
                            seeAllUrl="/search"
                            items={rentItems}
                            mockItems={MOCK_TRENDING}
                            router={router}
                        />

                        {/* 2. Academic Calculators */}
                        <ProductShelf
                            title="Academic Calculators"
                            emoji="🖩"
                            seeAllUrl="/search?category=calculator"
                            items={rentItems.filter(item => item.categoryId === "calculator" || (item as any).category === "calculator")}
                            mockItems={MOCK_CALCULATORS}
                            router={router}
                        />

                        {/* 3. Electronic Gadgets */}
                        <ProductShelf
                            title="Electronic Gadgets"
                            emoji="⚡"
                            seeAllUrl="/search?category=electronics"
                            items={rentItems.filter(item => ["electronics", "laptop", "camera", "accessories"].includes(item.categoryId || (item as any).category || ""))}
                            mockItems={MOCK_ELECTRONICS}
                            router={router}
                        />

                        {/* 4. Books */}
                        <ProductShelf
                            title="Books"
                            emoji="📚"
                            seeAllUrl="/search?category=books"
                            items={rentItems.filter(item => item.categoryId === "books" || (item as any).category === "books")}
                            mockItems={MOCK_BOOKS}
                            router={router}
                        />

                        {/* 5. Hostel Essentials */}
                        <ProductShelf
                            title="Hostel Essentials"
                            emoji="📦"
                            seeAllUrl="/search?category=others"
                            items={rentItems.filter(item => item.categoryId === "hostel-essentials" || (item as any).category === "hostel-essentials")}
                            mockItems={MOCK_HOSTEL}
                            router={router}
                        />

                        {/* Social Proof row */}
                        <div style={{
                            display: "flex", alignItems: "center", gap: 10,
                            background: "#F8FAFC", borderRadius: 16, padding: "14px 16px",
                            border: "1px solid #E5E7EB",
                            marginLeft: PP, marginRight: PP,
                        }}>
                            <div style={{ display: "flex" }}>
                                {[{ l: "S", bg: "linear-gradient(135deg,#5548E8,#7B72FF)" }, { l: "R", bg: "linear-gradient(135deg,#00C48C,#00A876)" }, { l: "A", bg: "linear-gradient(135deg,#FF9500,#FF7A00)" }, { l: "K", bg: "linear-gradient(135deg,#FF6B6B,#FF4444)" }].map(av => (
                                    <div key={av.l} style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", marginRight: -8, fontFamily: "var(--font-outfit), 'Outfit', sans-serif", background: av.bg }}>{av.l}</div>
                                ))}
                            </div>
                            <div style={{ marginLeft: 16, flex: 1 }}>
                                <strong style={{ fontFamily: "var(--font-outfit), 'Outfit', sans-serif", fontSize: 13, fontWeight: 700, color: "#1e293b", display: "block" }}>320 students active</strong>
                                <small style={{ fontSize: 11, color: "#64748b" }}>Saving money on {selectedCollege?.acronym || "your"} campus</small>
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#FF9500", fontFamily: "var(--font-outfit), 'Outfit', sans-serif", display: "flex", alignItems: "center", gap: 3 }}>⭐ 4.8</div>
                        </div>

                        {/* How It Works */}
                        <div style={{ paddingLeft: PP, paddingRight: PP }}>
                            <div style={{ fontFamily: "var(--font-outfit), 'Outfit', sans-serif", fontWeight: 700, fontSize: "var(--iy-section-title, 18px)", color: "#1e293b", marginBottom: 12 }}>How It Works</div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                                {[
                                    { n: "1", ic: "🔍", lb: "Find what you need" },
                                    { n: "2", ic: "💬", lb: "Message owner" },
                                    { n: "3", ic: "✅", lb: "Pick up & return" }
                                ].map(s => (
                                    <div key={s.n} style={{ background: "#fff", borderRadius: 16, padding: "16px 10px", textAlign: "center", border: "1px solid #E5E7EB" }}>
                                        <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(11,87,208,0.1)", color: "#0B57D0", fontFamily: "var(--font-outfit), 'Outfit', sans-serif", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>{s.n}</div>
                                        <div style={{ fontSize: 20, marginBottom: 6 }}>{s.ic}</div>
                                        <div style={{ fontSize: 10, fontWeight: 600, color: "#4B5563", lineHeight: 1.3 }}>{s.lb}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Campus For You */}
                        {selectedCollege && (
                            <div style={{ paddingLeft: PP, paddingRight: PP }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                                    <div style={{ fontFamily: "var(--font-outfit), 'Outfit', sans-serif", fontWeight: 700, fontSize: "var(--iy-section-title, 18px)", color: "#1e293b" }}>Campus Stats</div>
                                </div>
                                <div style={{ background: "#13131F", color: "#fff", padding: "20px", borderRadius: 24, position: "relative", overflow: "hidden" }}>
                                    <div style={{ position: "absolute", top: -40, right: -20, width: 150, height: 150, background: "radial-gradient(circle,rgba(85,72,232,0.3) 0%,transparent 70%)" }} />
                                    <h3 style={{ fontFamily: "var(--font-outfit), 'Outfit', sans-serif", fontWeight: 700, fontSize: 16, color: "#fff", marginBottom: 4, position: "relative", zIndex: 1 }}>🎓 {selectedCollege.name}</h3>
                                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 16, position: "relative", zIndex: 1 }}>Active student marketplace</p>

                                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", position: "relative", zIndex: 1 }}>
                                        <div style={{ background: "rgba(11,87,208,0.2)", color: "#8AB4F8", fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 20 }}>📊 Analytics Mode Active</div>
                                        <div style={{ background: "rgba(16,185,129,0.2)", color: "#10B981", fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 20 }}>⚡ Live Rentals Supported</div>
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
        <div className="iy-fu1 flex flex-col gap-5" style={{ paddingLeft: PP, paddingRight: PP }}>
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
        <div className="iy-fu1 flex flex-col gap-4" style={{ paddingLeft: PP, paddingRight: PP }}>

            {/* Browse categories for buy/sell */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "var(--iy-section-title, 18px)", color: "var(--iy-text1)" }}>Browse Items</div>
                <button onClick={() => router.push("/search")} style={{ fontSize: 13, fontWeight: 700, color: "var(--iy-primary)", background: "none", border: "none", cursor: "pointer" }}>
                    View all →
                </button>
            </div>

            <CategoryGrid />

            {/* Real items for sale grid */}
            {sellItems.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "var(--iy-section-title, 18px)", color: "var(--iy-text1)", marginBottom: 4, paddingLeft: PP, paddingRight: PP }}>Available on Campus 💰</div>
                    <div style={{
                        display: "flex",
                        gap: 12,
                        overflowX: "auto",
                        scrollbarWidth: "none",
                        scrollSnapType: "x mandatory",
                        scrollBehavior: "smooth",
                        WebkitOverflowScrolling: "touch",
                        paddingLeft: PP,
                        paddingRight: 0,
                        paddingBottom: 8
                    }} className="no-scrollbar">
                        {sellItems.map(item => (
                            <div key={item.id} onClick={() => router.push(`/rentals/${item.id}`)} style={{ cursor: "pointer", flexShrink: 0, scrollSnapAlign: "start" }}>
                                <ProductCard
                                    id={item.id}
                                    itemName={item.itemName}
                                    pricePerHour={item.pricePerHour}
                                    category={item.categoryId || "others"}
                                    branch={item.department || "CSE"}
                                    sellerUsername="member"
                                    distance={item.block || "Campus"}
                                    imageUrl={item.photoUrl}
                                    variant="scroll"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                /* Empty/placeholder state — sell */
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "var(--iy-section-title, 18px)", color: "var(--iy-text1)", marginBottom: 4 }}>Your Listings</div>
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
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "var(--iy-section-title, 18px)", color: "var(--iy-text1)", marginBottom: 12 }}>How to Sell</div>
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
