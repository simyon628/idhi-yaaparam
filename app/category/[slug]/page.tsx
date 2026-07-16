"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, SlidersHorizontal, Plus, X } from "lucide-react";
import { ProductCard } from "@/components/ui/ProductCard";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { useInfiniteItems } from "@/lib/hooks/useInfiniteItems";
import { useCollege } from "@/contexts/CollegeContext";
import { useSearchStore } from "@/stores/searchStore";

const BRANCH_CHIPS = ["All", "CSE", "ECE", "Mech", "Civil", "Bio", "IT", "EEE"];

const SORT_OPTIONS = [
  { id: "newest", label: "Newest" },
  { id: "price_asc", label: "Price ↑" },
  { id: "price_desc", label: "Price ↓" },
  { id: "rating", label: "Rating" },
];

const MOCK_ITEMS: Record<string, any[]> = {
  calculator: [
    { id: "c1", itemName: "Scientific Calculator Casio fx-991EX", pricePerHour: 15, category: "calculator", branch: "CSE", distance: "0.2 km", rating: 4.8, sellerUsername: "rahul_svec", imageUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&q=80" },
    { id: "c2", itemName: "Basic Casio Calculator fx-82MS", pricePerHour: 8, category: "calculator", branch: "Mech", distance: "0.4 km", rating: 4.2, sellerUsername: "anil_svec", imageUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&q=80" },
    { id: "c3", itemName: "Financial Calculator HP 10bII", pricePerHour: 20, category: "calculator", branch: "EEE", distance: "0.7 km", rating: 4.6, sellerUsername: "priya_svec", imageUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&q=80" },
    { id: "c4", itemName: "Casio fx-991CW Advanced Scientific", pricePerHour: 18, category: "calculator", branch: "ECE", distance: "0.3 km", rating: 4.9, sellerUsername: "deepak_svec", imageUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&q=80" },
    { id: "c5", itemName: "TI-84 Plus Graphing Calculator", pricePerHour: 25, category: "calculator", branch: "CSE", distance: "1.1 km", rating: 4.7, sellerUsername: "mohan_svec", imageUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&q=80" },
    { id: "c6", itemName: "Casio FX-CG50 Color Graphing", pricePerHour: 30, category: "calculator", branch: "Mech", distance: "0.6 km", rating: 4.5, sellerUsername: "lakshmi_svec", imageUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&q=80" },
  ],
  drafter: [
    { id: "d1", itemName: "Engineering Drafter Set", pricePerHour: 25, category: "drafter", branch: "Civil", distance: "1.2 km", rating: 4.5, sellerUsername: "vikas_svec", imageUrl: "https://images.unsplash.com/photo-1503387837-b154d5074bd2?w=400&q=80" },
    { id: "d2", itemName: "Mini Drafter Mech Special", pricePerHour: 20, category: "drafter", branch: "Mech", distance: "0.4 km", rating: 4.9, sellerUsername: "anil_svec", imageUrl: "https://images.unsplash.com/photo-1503387837-b154d5074bd2?w=400&q=80" },
    { id: "d3", itemName: "Civil Engineering T-Square", pricePerHour: 12, category: "drafter", branch: "Civil", distance: "0.8 km", rating: 4.1, sellerUsername: "ram_svec", imageUrl: "https://images.unsplash.com/photo-1503387837-b154d5074bd2?w=400&q=80" },
    { id: "d4", itemName: "Professional Draftsman Board A3", pricePerHour: 18, category: "drafter", branch: "Mech", distance: "0.5 km", rating: 4.3, sellerUsername: "sita_svec", imageUrl: "https://images.unsplash.com/photo-1503387837-b154d5074bd2?w=400&q=80" },
    { id: "d5", itemName: "Rotary Drafting Template & Stencils", pricePerHour: 8, category: "drafter", branch: "ECE", distance: "0.2 km", rating: 4.4, sellerUsername: "arun_svec", imageUrl: "https://images.unsplash.com/photo-1503387837-b154d5074bd2?w=400&q=80" },
    { id: "d6", itemName: "Kent Drafting Machine", pricePerHour: 35, category: "drafter", branch: "Mech", distance: "1.5 km", rating: 4.8, sellerUsername: "suresh_svec", imageUrl: "https://images.unsplash.com/photo-1503387837-b154d5074bd2?w=400&q=80" },
  ],
  "lab-coat": [
    { id: "l1", itemName: "Lab Coat White L Size", pricePerHour: 20, category: "lab-coat", branch: "Bio", distance: "0.1 km", rating: 4.0, sellerUsername: "priya_svec", imageUrl: "https://images.unsplash.com/photo-1581591524425-c7e0978865fc?w=400&q=80" },
    { id: "l2", itemName: "Lab Coat White M Size", pricePerHour: 18, category: "lab-coat", branch: "CSE", distance: "0.3 km", rating: 4.3, sellerUsername: "rahul_svec", imageUrl: "https://images.unsplash.com/photo-1581591524425-c7e0978865fc?w=400&q=80" },
    { id: "l3", itemName: "Premium Cotton Chemistry Lab Coat (S)", pricePerHour: 22, category: "lab-coat", branch: "Bio", distance: "0.5 km", rating: 4.7, sellerUsername: "divya_svec", imageUrl: "https://images.unsplash.com/photo-1581591524425-c7e0978865fc?w=400&q=80" },
    { id: "l4", itemName: "Heavy Duty Lab Apron Vinyl", pricePerHour: 15, category: "lab-coat", branch: "Bio", distance: "0.6 km", rating: 4.2, sellerUsername: "kiran_svec", imageUrl: "https://images.unsplash.com/photo-1581591524425-c7e0978865fc?w=400&q=80" },
    { id: "l5", itemName: "Hospital Grade Disinfectable Gown (XL)", pricePerHour: 25, category: "lab-coat", branch: "Bio", distance: "0.9 km", rating: 4.5, sellerUsername: "meena_svec", imageUrl: "https://images.unsplash.com/photo-1581591524425-c7e0978865fc?w=400&q=80" },
    { id: "l6", itemName: "Biology Specimen Lab Coat (M)", pricePerHour: 19, category: "lab-coat", branch: "Bio", distance: "0.2 km", rating: 4.6, sellerUsername: "arun_svec", imageUrl: "https://images.unsplash.com/photo-1581591524425-c7e0978865fc?w=400&q=80" },
  ],
  laptop: [
    { id: "lp1", itemName: "MacBook Pro M2 16GB", pricePerHour: 120, category: "laptop", branch: "CSE", distance: "0.8 km", rating: 4.9, sellerUsername: "ram_svec", imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80" },
    { id: "lp2", itemName: "MacBook Air M1 8GB", pricePerHour: 100, category: "laptop", branch: "IT", distance: "0.6 km", rating: 4.7, sellerUsername: "sneha_svec", imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80" },
    { id: "lp3", itemName: "Dell XPS 13 Core i7", pricePerHour: 110, category: "laptop", branch: "CSE", distance: "1.0 km", rating: 4.6, sellerUsername: "kiran_svec", imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80" },
    { id: "lp4", itemName: "Lenovo ThinkPad X1 Carbon", pricePerHour: 115, category: "laptop", branch: "IT", distance: "0.5 km", rating: 4.8, sellerUsername: "suresh_svec", imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80" },
    { id: "lp5", itemName: "ASUS ROG Zephyrus Gaming Laptop", pricePerHour: 140, category: "laptop", branch: "CSE", distance: "1.2 km", rating: 4.9, sellerUsername: "naveen_svec", imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80" },
    { id: "lp6", itemName: "HP Pavilion 15 Ryzen 5", pricePerHour: 80, category: "laptop", branch: "ECE", distance: "0.9 km", rating: 4.3, sellerUsername: "sanjay_svec", imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80" },
  ],
  camera: [
    { id: "cm1", itemName: "Canon DSLR Camera EOS 80D", pricePerHour: 60, category: "camera", branch: "ECE", distance: "1.0 km", rating: 4.8, sellerUsername: "anil_svec", imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&q=80" },
    { id: "cm2", itemName: "Nikon D3500 Starter DSLR", pricePerHour: 50, category: "camera", branch: "EEE", distance: "0.8 km", rating: 4.5, sellerUsername: "mohan_svec", imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&q=80" },
    { id: "cm3", itemName: "Sony Alpha a6400 Mirrorless", pricePerHour: 75, category: "camera", branch: "CSE", distance: "0.5 km", rating: 4.9, sellerUsername: "deepak_svec", imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&q=80" },
    { id: "cm4", itemName: "GoPro Hero 10 Black Action Cam", pricePerHour: 40, category: "camera", branch: "Mech", distance: "0.4 km", rating: 4.7, sellerUsername: "suresh_svec", imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&q=80" },
    { id: "cm5", itemName: "Fujifilm X-T30 Mirrorless Camera", pricePerHour: 70, category: "camera", branch: "ECE", distance: "1.2 km", rating: 4.6, sellerUsername: "swetha_svec", imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&q=80" },
    { id: "cm6", itemName: "Canon Powershot Point & Shoot", pricePerHour: 30, category: "camera", branch: "Civil", distance: "0.3 km", rating: 4.1, sellerUsername: "ganesh_svec", imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&q=80" },
  ],
  books: [
    { id: "bk1", itemName: "GATE CSE Preparation Book Set", pricePerHour: 10, category: "books", branch: "CSE", distance: "0.5 km", rating: 4.6, sellerUsername: "arun_svec", imageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80" },
    { id: "bk2", itemName: "Introduction to Algorithms (CLRS)", pricePerHour: 12, category: "books", branch: "CSE", distance: "0.2 km", rating: 4.9, sellerUsername: "kiran_svec", imageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80" },
    { id: "bk3", itemName: "Engineering Physics Textbook", pricePerHour: 8, category: "books", branch: "ECE", distance: "0.6 km", rating: 4.2, sellerUsername: "meena_svec", imageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80" },
    { id: "bk4", itemName: "Data Structures & Algorithms Made Easy", pricePerHour: 10, category: "books", branch: "CSE", distance: "0.3 km", rating: 4.7, sellerUsername: "naveen_svec", imageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80" },
    { id: "bk5", itemName: "Operating Systems Concepts (Galvin)", pricePerHour: 12, category: "books", branch: "IT", distance: "0.7 km", rating: 4.8, sellerUsername: "ravi_svec", imageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80" },
    { id: "bk6", itemName: "Engineering Mathematics Vol 1 & 2", pricePerHour: 8, category: "books", branch: "EEE", distance: "0.4 km", rating: 4.3, sellerUsername: "priya_svec", imageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80" },
  ],
  hostel: [
    { id: "hs1", itemName: "Hostel Study Lamp LED", pricePerHour: 8, category: "hostel", branch: "CSE", distance: "0.3 km", rating: 4.5, sellerUsername: "divya_svec", imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&q=80" },
    { id: "hs2", itemName: "Electric Kettle 1.5L Kent", pricePerHour: 12, category: "hostel", branch: "Mech", distance: "0.4 km", rating: 4.7, sellerUsername: "prasad_svec", imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&q=80" },
    { id: "hs3", itemName: "Pedestal Fan 3-Speed High Speed", pricePerHour: 15, category: "hostel", branch: "ECE", distance: "0.6 km", rating: 4.4, sellerUsername: "swetha_svec", imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&q=80" },
    { id: "hs4", itemName: "Iron Box Steam Press Philips", pricePerHour: 10, category: "hostel", branch: "CSE", distance: "0.2 km", rating: 4.3, sellerUsername: "ganesh_svec", imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&q=80" },
    { id: "hs5", itemName: "Induction Cooktop Portable", pricePerHour: 18, category: "hostel", branch: "Mech", distance: "0.5 km", rating: 4.6, sellerUsername: "harish_svec", imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&q=80" },
    { id: "hs6", itemName: "Mini Fridge 45L Compact Haier", pricePerHour: 25, category: "hostel", branch: "EEE", distance: "0.8 km", rating: 4.8, sellerUsername: "pooja_svec", imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&q=80" },
  ],
  "hostel-essentials": [
    { id: "hs1", itemName: "Hostel Study Lamp LED", pricePerHour: 8, category: "hostel-essentials", branch: "CSE", distance: "0.3 km", rating: 4.5, sellerUsername: "divya_svec", imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&q=80" },
    { id: "hs2", itemName: "Electric Kettle 1.5L Kent", pricePerHour: 12, category: "hostel-essentials", branch: "Mech", distance: "0.4 km", rating: 4.7, sellerUsername: "prasad_svec", imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&q=80" },
    { id: "hs3", itemName: "Pedestal Fan 3-Speed High Speed", pricePerHour: 15, category: "hostel-essentials", branch: "ECE", distance: "0.6 km", rating: 4.4, sellerUsername: "swetha_svec", imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&q=80" },
    { id: "hs4", itemName: "Iron Box Steam Press Philips", pricePerHour: 10, category: "hostel-essentials", branch: "CSE", distance: "0.2 km", rating: 4.3, sellerUsername: "ganesh_svec", imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&q=80" },
    { id: "hs5", itemName: "Induction Cooktop Portable", pricePerHour: 18, category: "hostel-essentials", branch: "Mech", distance: "0.5 km", rating: 4.6, sellerUsername: "harish_svec", imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&q=80" },
    { id: "hs6", itemName: "Mini Fridge 45L Compact Haier", pricePerHour: 25, category: "hostel-essentials", branch: "EEE", distance: "0.8 km", rating: 4.8, sellerUsername: "pooja_svec", imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&q=80" },
  ],
  accessories: [
    { id: "ac1", itemName: "Bluetooth Headphones Noise Cancelling", pricePerHour: 30, category: "accessories", branch: "ECE", distance: "0.9 km", rating: 4.8, sellerUsername: "sanjay_svec", imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80" },
    { id: "ac2", itemName: "USB-C Hub 7-in-1 Adapter", pricePerHour: 10, category: "accessories", branch: "CSE", distance: "0.2 km", rating: 4.6, sellerUsername: "karthik_svec", imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80" },
    { id: "ac3", itemName: "Logitech Wireless Mouse MX Master", pricePerHour: 15, category: "accessories", branch: "IT", distance: "0.5 km", rating: 4.9, sellerUsername: "sneha_svec", imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80" },
    { id: "ac4", itemName: "Laptop Cooling Pad RGB Fan", pricePerHour: 8, category: "accessories", branch: "CSE", distance: "0.4 km", rating: 4.4, sellerUsername: "arun_svec", imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80" },
    { id: "ac5", itemName: "Laptop Sleeve Case Waterproof", pricePerHour: 5, category: "accessories", branch: "ECE", distance: "0.3 km", rating: 4.2, sellerUsername: "deepak_svec", imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80" },
    { id: "ac6", itemName: "Mechanical Keyboard Red Switches", pricePerHour: 20, category: "accessories", branch: "CSE", distance: "0.7 km", rating: 4.7, sellerUsername: "ravi_svec", imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80" },
  ],
  electronics: [
    { id: "el1", itemName: "Arduino Uno Ultimate Starter Kit", pricePerHour: 15, category: "electronics", branch: "ECE", distance: "0.5 km", rating: 4.7, sellerUsername: "vijay_svec", imageUrl: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=400&q=80" },
    { id: "el2", itemName: "Raspberry Pi 4 Model B 8GB", pricePerHour: 20, category: "electronics", branch: "CSE", distance: "0.4 km", rating: 4.8, sellerUsername: "suresh_svec", imageUrl: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=400&q=80" },
    { id: "el3", itemName: "Digital Soldering Iron Kit", pricePerHour: 12, category: "electronics", branch: "EEE", distance: "0.6 km", rating: 4.3, sellerUsername: "deepak_svec", imageUrl: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=400&q=80" },
    { id: "el4", itemName: "Digital Multimeter Tester Tool", pricePerHour: 10, category: "electronics", branch: "ECE", distance: "0.3 km", rating: 4.5, sellerUsername: "sanjay_svec", imageUrl: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=400&q=80" },
    { id: "el5", itemName: "Breadboard & Jumper Wire Assortment", pricePerHour: 5, category: "electronics", branch: "CSE", distance: "0.2 km", rating: 4.2, sellerUsername: "karthik_svec", imageUrl: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=400&q=80" },
    { id: "el6", itemName: "ESP32 NodeMCU Wi-Fi Module", pricePerHour: 8, category: "electronics", branch: "IT", distance: "0.5 km", rating: 4.6, sellerUsername: "sneha_svec", imageUrl: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=400&q=80" },
  ],
};

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const { slug } = React.use(params);
  const { selectedCollege } = useCollege();
  const [sortBy, setSortBy] = useState("newest");
  const [activeBranch, setActiveBranch] = useState("All");
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const { open: openSearch, close: closeSearch, setQuery, executeSearch, query: storeQuery } = useSearchStore();
  const [searchInputVal, setSearchInputVal] = useState("");

  // Sync input value with store query
  useEffect(() => {
    setSearchInputVal(storeQuery);
  }, [storeQuery]);

  // Clean search on page unmount
  useEffect(() => {
    return () => {
      closeSearch();
    };
  }, [closeSearch]);

  const { items: firestoreItems, isLoading, isLoadingMore, hasMore, setSentinel } =
    useInfiniteItems(selectedCollege?.id, slug);

  const displayTitle = slug
    ? slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : 'Category';

  // Merge real + mock items, prioritizing real
  const mockFallback = MOCK_ITEMS[slug] || [];
  const combined = [...firestoreItems];
  if (!isLoading) {
    mockFallback.forEach((mock) => {
      if (!combined.some((item: any) => item.id === mock.id || item.itemName === mock.itemName)) {
        combined.push(mock);
      }
    });
  }
  let allItems = combined;

  // Filter by branch
  if (activeBranch !== 'All') {
    allItems = allItems.filter((i: any) => (i.department || i.branch) === activeBranch);
  }

  // Sort
  const sorted = [...allItems].sort((a: any, b: any) => {
    if (sortBy === 'price_asc') return a.pricePerHour - b.pricePerHour;
    if (sortBy === 'price_desc') return b.pricePerHour - a.pricePerHour;
    return 0;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#F8F9FC", fontFamily: "'DM Sans', sans-serif" }}>
      
      {/* Sticky Header */}
      <div style={{ position: "sticky", top: 0, zIndex: 30, background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        {/* Top bar */}
        {isSearching ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", gap: 10 }}>
            <button 
              onClick={() => { 
                setIsSearching(false); 
                closeSearch(); 
              }} 
              style={{ background: "#f1f5f9", border: "none", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <ArrowLeft size={20} color="#334155" />
            </button>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (searchInputVal.trim()) {
                  executeSearch(searchInputVal, router);
                }
              }} 
              style={{ flex: 1, display: "flex", alignItems: "center", background: "#f1f5f9", borderRadius: 12, padding: "0 10px" }}
            >
              <input 
                type="text" 
                value={searchInputVal}
                onChange={(e) => {
                  setSearchInputVal(e.target.value);
                  setQuery(e.target.value);
                }}
                onFocus={openSearch}
                placeholder={`Search in ${displayTitle}...`}
                autoFocus
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 13, fontWeight: "bold", padding: "10px 4px", color: "#1e293b" }}
              />
              {searchInputVal && (
                <button 
                  type="button" 
                  onClick={() => {
                    setSearchInputVal("");
                    setQuery("");
                  }}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
                >
                  <X size={16} color="#64748b" />
                </button>
              )}
            </form>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={() => router.back()} style={{ background: "#f1f5f9", border: "none", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <ArrowLeft size={20} color="#334155" />
              </button>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{displayTitle}</div>
                <div style={{ fontSize: 10, color: "#64748b", fontWeight: 500 }}>{sorted.length > 0 ? `${sorted.length}+ listings nearby` : 'Loading...'}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={() => { setIsSearching(true); openSearch(); }} style={{ background: "#f1f5f9", border: "none", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <Search size={18} color="#334155" />
              </button>
              <button onClick={() => setShowFilterSheet(true)} style={{ background: "#EEF0FF", border: "none", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <SlidersHorizontal size={18} color="#0B57D0" />
              </button>
            </div>
          </div>
        )}

        {/* Combined Filter & Sort buttons bar (replacing the multiple bulky rows of chips) */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px 10px", gap: 10, borderBottom: "1px solid #f1f5f9" }}>
          {/* Sort Selection Button */}
          <button 
            onClick={() => setShowFilterSheet(true)}
            style={{ 
              flex: 1, 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              gap: 6, 
              padding: "8px 12px", 
              borderRadius: 10, 
              background: "#f8fafc", 
              border: "1px solid #e2e8f0", 
              fontSize: 12, 
              color: "#334155", 
              fontWeight: 500,
              cursor: "pointer"
            }}
          >
            <span>Sort:</span>
            <span style={{ fontWeight: 700, color: "#0B57D0" }}>
              {SORT_OPTIONS.find(o => o.id === sortBy)?.label || "Newest"}
            </span>
          </button>

          {/* Branch Selection Button */}
          <button 
            onClick={() => setShowFilterSheet(true)}
            style={{ 
              flex: 1, 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              gap: 6, 
              padding: "8px 12px", 
              borderRadius: 10, 
              background: "#f8fafc", 
              border: "1px solid #e2e8f0", 
              fontSize: 12, 
              color: "#334155", 
              fontWeight: 500,
              cursor: "pointer"
            }}
          >
            <span>Branch:</span>
            <span style={{ fontWeight: 700, color: "#0B57D0" }}>
              {activeBranch}
            </span>
          </button>
        </div>
      </div>

      {/* Product Grid */}
      <div style={{ padding: "12px 12px 100px", flex: 1 }}>
        {isLoading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
            {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} variant="grid" />)}
          </div>
        ) : sorted.length === 0 ? (
          <EmptyState
            title={`No ${displayTitle}s Available`}
            description={`Be the first student to list a ${displayTitle.toLowerCase()} and start earning!`}
            emoji="📦"
            actionLabel="+ List Yours"
            actionHref={`/rentals/new?category=${slug}`}
          />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
            {sorted.map((item: any) => (
              <div key={item.id} onClick={() => router.push(`/rentals/${item.id}`)} style={{ cursor: "pointer", width: "100%", display: "flex", justifyContent: "center" }}>
                <ProductCard
                  id={item.id}
                  itemName={item.itemName}
                  pricePerHour={item.pricePerHour}
                  category={item.categoryId || item.category || "others"}
                  branch={item.department || item.branch || "CSE"}
                  distance={item.block || item.distance || "0.5 km"}
                  sellerUsername={item.sellerUsername || "member"}
                  rating={item.rating || 4.5}
                  imageUrl={item.photoUrl || item.imageUrl}
                  variant="grid"
                />
              </div>
            ))}

            {/* Infinite scroll loading skeletons */}
            {isLoadingMore && (
              <>
                {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={`more-${i}`} variant="grid" />)}
              </>
            )}
          </div>
        )}

        {/* Sentinel for IntersectionObserver */}
        {!isLoading && hasMore && (
          <div ref={setSentinel} style={{ height: 40, marginTop: 8 }} />
        )}
      </div>



      {/* Filter Bottom Sheet */}
      {showFilterSheet && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "flex-end" }}>
          <div
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
            onClick={() => setShowFilterSheet(false)}
          />
          <div style={{
            position: "relative", width: "100%", background: "#fff",
            borderRadius: "24px 24px 0 0", padding: "20px 20px 40px", zIndex: 10,
            animation: "slideUp 0.25s cubic-bezier(0.22, 1, 0.36, 1) both",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Filters</h3>
              <button onClick={() => setShowFilterSheet(false)} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, padding: "6px 8px", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: 11, fontWeight: 800, color: "#0B57D0", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Sort By</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
              {SORT_OPTIONS.map(opt => (
                <button key={opt.id} onClick={() => { setSortBy(opt.id); setShowFilterSheet(false); }}
                  style={{ padding: "8px 16px", borderRadius: 20, fontSize: 13, fontWeight: 700,
                    border: sortBy === opt.id ? "1.5px solid #0B57D0" : "1.5px solid #e2e8f0",
                    background: sortBy === opt.id ? "#EEF0FF" : "#fff",
                    color: sortBy === opt.id ? "#0B57D0" : "#475569", cursor: "pointer" }}
                >{opt.label}</button>
              ))}
            </div>

            <p style={{ fontSize: 11, fontWeight: 800, color: "#0B57D0", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Branch</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {BRANCH_CHIPS.map(branch => (
                <button key={branch} onClick={() => { setActiveBranch(branch); setShowFilterSheet(false); }}
                  style={{ padding: "8px 16px", borderRadius: 20, fontSize: 13, fontWeight: 700,
                    border: activeBranch === branch ? "1.5px solid #0B57D0" : "1.5px solid #e2e8f0",
                    background: activeBranch === branch ? "#EEF0FF" : "#fff",
                    color: activeBranch === branch ? "#0B57D0" : "#475569", cursor: "pointer" }}
                >{branch}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
