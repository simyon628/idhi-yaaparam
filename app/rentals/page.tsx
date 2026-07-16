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
    Package,
    SlidersHorizontal
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
import { BannerCarousel } from "@/components/ui/BannerCarousel";

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
                paddingRight: "15px",
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
                    paddingBottom: 4,
                    paddingRight: "15px",
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
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [isFadingOut, setIsFadingOut] = useState(false);
    const userId = auth?.currentUser?.uid;

    const SEARCH_PLACEHOLDERS = [
        "Search \"Calculators\"",
        "Search \"Engineering Drafters\"",
        "Search \"Geometry Kits\"",
        "Search \"Lab Coats\"",
        "Search \"Books\"",
        "Search \"Laptops\"",
        "Search \"Scientific Calculator\"",
        "Search \"Camera\""
    ];

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

    // Rotating Search Placeholder
    useEffect(() => {
        const interval = setInterval(() => {
            setIsFadingOut(true);
            setTimeout(() => {
                setPlaceholderIndex((prev) => (prev + 1) % SEARCH_PLACEHOLDERS.length);
                setIsFadingOut(false);
            }, 300); // fade out duration
        }, 3000); // 3s per word
        return () => clearInterval(interval);
    }, [SEARCH_PLACEHOLDERS.length]);

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

    const currentPlaceholder = SEARCH_PLACEHOLDERS[placeholderIndex];

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
            style={{
                background: "#ffffff",
                fontFamily: "'DM Sans', sans-serif",
                paddingLeft: "15px",
                paddingRight: "0px"
            }}
        >
            {/* ══════════════════════════════════════════════════════════════
                HEADER SECTION — All elements start from --iy-page-padding (15px)
            ══════════════════════════════════════════════════════════════ */}
            <div style={{
                position: "relative",
                background: "#ffffff",
                paddingBottom: 0,
            }}>
                {/* ── Three Mode Tabs ── */}
                <div style={{
                    display: "flex", gap: 8,
                    paddingTop: 14,
                    position: "relative", zIndex: 2,
                    paddingRight: "15px",
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

                {/* ── Search + Notification Row ── */}
                <div style={{
                    display: "flex", alignItems: "center", gap: 12,
                    marginTop: 16,
                    marginBottom: 16,
                    position: "relative", zIndex: 2,
                    paddingRight: "15px",
                }}>
                    <form onSubmit={handleSearchSubmit} style={{
                        display: "flex", alignItems: "center", background: "#FFFFFF",
                        border: "1px solid #E5E7EB",
                        borderRadius: 28, height: 50, flex: 1, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflow: "hidden", paddingRight: 8,
                        position: "relative"
                    }}>
                        <button type="submit" style={{ padding: "0 12px 0 16px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}>
                            <SearchIcon style={{ width: 20, height: 20, color: "#4B5563" }} />
                        </button>

                        <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", height: "100%" }}>
                            {!searchInputVal && (
                                <div style={{
                                    position: "absolute",
                                    left: 0,
                                    pointerEvents: "none",
                                    color: "#9CA3AF",
                                    fontWeight: 500, fontSize: 14,
                                    fontFamily: "'DM Sans', sans-serif",
                                    transition: "opacity 0.3s ease-in-out",
                                    opacity: isFadingOut ? 0 : 1,
                                    whiteSpace: "nowrap"
                                }}>
                                    {currentPlaceholder}
                                </div>
                            )}
                            <input
                                type="text" value={searchInputVal}
                                onChange={(e) => { setSearchInputVal(e.target.value); setQuery(e.target.value); }}
                                onClick={openSearch}
                                style={{
                                    width: "100%", background: "transparent", border: "none", outline: "none",
                                    fontWeight: 500, fontSize: 14, color: theme.header.searchText,
                                    fontFamily: "'DM Sans', sans-serif",
                                    position: "relative", zIndex: 1
                                }}
                            />
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 2, zIndex: 2 }}>
                            <button type="button" style={{ padding: 8, background: "none", border: "none", cursor: "pointer" }}><Camera style={{ width: 16, height: 16, color: "#9CA3AF" }} /></button>
                            <button type="button" style={{ padding: 8, background: "none", border: "none", cursor: "pointer" }}><Mic style={{ width: 16, height: 16, color: "#9CA3AF" }} /></button>
                        </div>
                    </form>

                    <button onClick={() => router.push("/notifications")} style={{
                        width: 50, height: 50, background: "#FFFFFF", border: "1px solid #E5E7EB",
                        borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", position: "relative", fontSize: 20, flexShrink: 0,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    }}>
                        🔔
                        {unreadCount > 0 && (
                            <span style={{ position: "absolute", top: 12, right: 12, width: 8, height: 8, background: "#FF5F5F", borderRadius: "50%", border: `1.5px solid #FFFFFF` }} />
                        )}
                    </button>
                </div>

                {/* ── DYNAMIC CAROUSEL — aligned to page padding (15px) ── */}
                <div style={{
                    marginBottom: 16,
                    position: "relative", zIndex: 2,
                    paddingRight: "15px",
                }}>
                    <BannerCarousel images={[
                      "/banners/promo1.png",
                      "/banners/promo2.jpg",
                      "/banners/promo3.jpg",
                      "/banners/promo1.png"
                    ]} />
                </div>

                {/* ── CATEGORY SECTION — left-aligned, scrolls to edge ── */}
                <section style={{ position: "relative", zIndex: 2, marginBottom: 20 }}>
                    <div style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        marginBottom: 14,
                        paddingRight: "15px",
                    }}>
                        <div style={{
                            fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
                            fontSize: "var(--iy-section-title, 18px)",
                            fontWeight: 700,
                            color: "#1e293b"
                        }}>
                            Categories
                        </div>
                    </div>
                    <div style={{
                        display: "flex",
                        gap: 12,
                        overflowX: "auto",
                        scrollbarWidth: "none",
                        scrollSnapType: "x mandatory",
                        scrollBehavior: "smooth",
                        WebkitOverflowScrolling: "touch",
                        paddingBottom: 4,
                        paddingRight: "15px",
                    }} className="no-scrollbar">
                        {[{ id: "all", name: "All", icon: <SlidersHorizontal size={24} /> }, ...CATEGORIES[activeMode]].map(cat => {
                            const isActive = cat.id === "all";
                            return (
                                <div
                                    key={cat.id}
                                    onClick={() => {
                                        if (cat.id !== "all") {
                                            router.push(`/category/${cat.id}`);
                                        }
                                    }}
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        gap: 6,
                                        cursor: "pointer",
                                        flexShrink: 0,
                                        width: "calc((min(100vw, 448px) - 80px) / 5.5)",
                                        scrollSnapAlign: "start",
                                        position: "relative"
                                    }}
                                >
                                    <div style={{
                                        width: "var(--iy-cat-icon)",
                                        height: "var(--iy-cat-icon)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: isActive ? "#0B57D0" : "#4B5563",
                                        flexShrink: 0,
                                        transform: isActive ? "scale(1.1)" : "scale(1)",
                                        transition: "all 0.2s ease"
                                    }}>
                                        {cat.icon}
                                    </div>
                                    <span className="cat-label" style={{ 
                                        color: isActive ? "#0B57D0" : "#111827", 
                                        fontWeight: isActive ? 800 : 600 
                                    }}>{cat.name}</span>
                                    {isActive && (
                                        <div style={{
                                            position: "absolute",
                                            bottom: -8,
                                            width: 24,
                                            height: 3,
                                            background: "#0B57D0",
                                            borderRadius: 2
                                        }} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>
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
                            marginRight: "15px",
                        }}>
                            <div style={{ display: "flex" }}>
                                {[{ l: "S", bg: "linear-gradient(135deg,#0B57D0,#0B57D0)" }, { l: "R", bg: "linear-gradient(135deg,#00C48C,#00A876)" }, { l: "A", bg: "linear-gradient(135deg,#FF9500,#FF7A00)" }, { l: "K", bg: "linear-gradient(135deg,#FF6B6B,#FF4444)" }].map(av => (
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
                        <div style={{ paddingRight: "15px" }}>
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
                            <div style={{ paddingRight: "15px" }}>
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
        <div className="iy-fu1 flex flex-col gap-5" style={{ paddingRight: "15px" }}>
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
                    {[{ l: "S", bg: "linear-gradient(135deg,#0B57D0,#0B57D0)" }, { l: "R", bg: "linear-gradient(135deg,#00C48C,#00A876)" }, { l: "A", bg: "linear-gradient(135deg,#FF9500,#FF7A00)" }, { l: "K", bg: "linear-gradient(135deg,#FF6B6B,#FF4444)" }].map(av => (
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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4, paddingRight: "15px" }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "var(--iy-section-title, 18px)", color: "var(--iy-text1)" }}>Browse Items</div>
                <button onClick={() => router.push("/search")} style={{ fontSize: 13, fontWeight: 700, color: "var(--iy-primary)", background: "none", border: "none", cursor: "pointer" }}>
                    View all →
                </button>
            </div>

            <div style={{ paddingRight: "15px" }}>
                <CategoryGrid />
            </div>

            {/* Real items for sale grid */}
            {sellItems.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "var(--iy-section-title, 18px)", color: "var(--iy-text1)", marginBottom: 4, paddingRight: "15px" }}>Available on Campus 💰</div>
                    <div style={{
                        display: "flex",
                        gap: 12,
                        overflowX: "auto",
                        scrollbarWidth: "none",
                        scrollSnapType: "x mandatory",
                        scrollBehavior: "smooth",
                        WebkitOverflowScrolling: "touch",
                        paddingBottom: 8,
                        paddingRight: "15px",
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
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12, paddingRight: "15px" }}>
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
            <div style={{ marginTop: 12, paddingRight: "15px" }}>
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
