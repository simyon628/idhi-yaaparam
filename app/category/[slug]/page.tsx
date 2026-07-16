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
    { id: "c1", itemName: "Scientific Calculator Casio fx-991EX", pricePerHour: 15, category: "calculator", branch: "CSE", distance: "0.2 km", rating: 4.8, imageUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&q=80" },
    { id: "c2", itemName: "Basic Casio Calculator", pricePerHour: 5, category: "calculator", branch: "Mech", distance: "0.5 km", rating: 4.2, imageUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&q=80" },
  ],
  drafter: [
    { id: "d1", itemName: "Engineering Drafter Set", pricePerHour: 25, category: "drafter", branch: "Civil", distance: "1.2 km", rating: 4.5, imageUrl: "https://images.unsplash.com/photo-1503387837-b154d5074bd2?w=400&q=80" },
    { id: "d2", itemName: "Mini Drafter", pricePerHour: 20, category: "drafter", branch: "Mech", distance: "0.4 km", rating: 4.9, imageUrl: "https://images.unsplash.com/photo-1503387837-b154d5074bd2?w=400&q=80" },
  ],
  "lab-coat": [
    { id: "l1", itemName: "Lab Coat White L Size", pricePerHour: 20, category: "lab-coat", branch: "Bio", distance: "0.1 km", rating: 4.0, imageUrl: "https://images.unsplash.com/photo-1581591524425-c7e0978865fc?w=400&q=80" },
    { id: "l2", itemName: "Lab Coat White M Size", pricePerHour: 18, category: "lab-coat", branch: "CSE", distance: "0.3 km", rating: 4.3, imageUrl: "https://images.unsplash.com/photo-1581591524425-c7e0978865fc?w=400&q=80" },
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
  let allItems = firestoreItems.length > 0 ? firestoreItems : (isLoading ? [] : mockFallback) as any[];

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
