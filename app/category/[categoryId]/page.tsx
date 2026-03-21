"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { useCollege } from "@/contexts/CollegeContext";
import { CATEGORIES } from "@/components/ui/CategoryGrid";
import { TopBar } from "@/components/layout/TopBar";
import { ChevronLeft, SearchX } from "lucide-react";
import { getCachedItems } from "@/lib/cache/itemsCache";

// ─── Category → keywords map (expanded & strict) ──────────────────────────
const categoryMap: Record<string, string[]> = {
  'calculator':    ['calculator','casio','scientific','fx-991','fx991','calc'],
  'drafter':       ['drafter','drawing board','drafting','mini drafter','a1 board','a2 board'],
  'lab-coat':      ['lab coat','labcoat','lab-coat','apron','white coat'],
  'geometry-set':  ['geometry','compass','protractor','set square','geometry set'],
  'books':         ['book','notes','textbook','notebook','novel','guide','material'],
  'electronics':   ['laptop','phone','charger','earphone','powerbank','cable','adapter','electronic','gadget','device'],
  'others':        [],
};

// ─── Strict filter: each category only shows its own items ────────────────
const filterByCategory = (items: any[], categoryId: string) => {
  const keywords = categoryMap[categoryId] ?? [];

  if (categoryId === 'others') {
    const allKnownKeywords = Object.values(categoryMap).flat();
    return items.filter(item => {
      const text = (
        (item.title ?? '') + ' ' +
        (item.category ?? '') + ' ' +
        (item.description ?? '')
      ).toLowerCase();
      return !allKnownKeywords.some(kw => text.includes(kw));
    });
  }

  return items.filter(item => {
    const text = (
      (item.title ?? '') + ' ' +
      (item.category ?? '') + ' ' +
      (item.description ?? '')
    ).toLowerCase();
    return keywords.some(kw => text.includes(kw));
  });
};

// ─── Category-specific placeholder images ────────────────────────────────
const getCategoryPlaceholder = (category: string): string => {
  const placeholders: Record<string, string> = {
    'calculator':   '/icons/calculator.svg',
    'drafter':      '/icons/drafter.svg',
    'lab-coat':     '/icons/labcoat.svg',
    'geometry-set': '/icons/book.svg',
    'books':        '/icons/book.svg',
    'electronics':  '/icons/electronics.svg',
  };
  return placeholders[category] ?? '/icons/package.svg';
};

// ─── Skeleton ─────────────────────────────────────────────────────────────
function CategorySkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', padding: '16px' }}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="aspect-[4/5] bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
      ))}
    </div>
  );
}

// ─── Item Card ────────────────────────────────────────────────────────────
function ItemCard({ item, categoryId }: { item: any; categoryId: string }) {
  const router = useRouter();

  const typeBadge = item.listingType === 'sell' ? 'Sell' : item.listingType === 'buy' ? 'Buy' : 'Rent';
  const conditionBadge = item.condition
    ? item.condition.charAt(0).toUpperCase() + item.condition.slice(1)
    : 'Good';

  const priceText =
    item.listingType === 'rent'
      ? `₹${item.pricePerHour || item.price || 0}/hr`
      : `₹${item.price || item.pricePerHour || 0}`;

  const titleText = item.title || item.itemName || 'Item';
  const imageSrc = item.images?.[0] || item.imageUrl || '';
  const placeholder = getCategoryPlaceholder(categoryId);

  return (
    <div
      onClick={() => router.push(`/item/${item.id}`)}
      className="flex flex-col bg-white rounded-xl overflow-hidden border border-slate-100 shadow-sm active:scale-95 transition-transform cursor-pointer"
    >
      <div className="w-full aspect-[4/3] bg-slate-100 relative">
        <img
          src={imageSrc || placeholder}
          alt={titleText}
          loading="lazy"
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.currentTarget;
            if (target.src !== window.location.origin + placeholder) {
              target.src = placeholder;
            }
          }}
        />
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <span className="bg-indigo-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider w-fit">
            {typeBadge}
          </span>
          <span className="bg-white/90 backdrop-blur text-slate-700 text-[10px] font-bold px-1.5 py-0.5 rounded-md w-fit">
            {conditionBadge}
          </span>
        </div>
      </div>
      <div className="p-2 flex flex-col gap-0.5 bg-white">
        <h3 className="text-[13px] font-bold text-slate-800 line-clamp-1 select-none">{titleText}</h3>
        <span className="text-[12px] font-bold text-purple-600 select-none">{priceText}</span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────
export default function CategoryPage({ params }: { params: Promise<{ categoryId: string }> }) {
  const router = useRouter();
  const { categoryId } = use(params);
  const { selectedCollege, isReady } = useCollege();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const category = CATEGORIES.find(c => c.id === categoryId);
  const categoryName = category?.name || 'Category';

  useEffect(() => {
    if (!selectedCollege || !db) return;

    setLoading(true);

    getCachedItems(db, selectedCollege.id)
      .then(all => {
        const filtered = filterByCategory(all, categoryId);
        setItems(filtered);
      })
      .catch(err => console.error('Category fetch error:', err))
      .finally(() => setLoading(false));
  }, [selectedCollege, categoryId]);

  if (!isReady || !selectedCollege) return null;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50 relative pb-24">
      <TopBar />

      <div className="mt-[72px] px-5 py-4">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-slate-500 font-bold text-sm mb-4">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        <div className="mb-6">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">{categoryName}</h1>
          {/* Only show count after loading to avoid "0 items" flash */}
          {!loading && (
            <p className="text-sm font-bold text-slate-500 mt-1">{items.length} items available</p>
          )}
        </div>

        {loading ? (
          <CategorySkeleton />
        ) : items.length === 0 ? (
          <div className="mt-20 flex flex-col items-center justify-center text-center px-4">
            <SearchX className="w-10 h-10 text-slate-400 mb-4" />
            <h2 className="text-xl font-bold text-slate-700 mb-1">No {categoryName} items yet</h2>
            <p className="text-sm text-slate-500 mb-6">Be the first to list one!</p>
            <button
              onClick={() => router.push('/listings/new')}
              className="bg-indigo-600 text-white px-6 py-3 rounded-full font-bold text-sm shadow-indigo active:scale-95 transition-transform"
            >
              + List Item
            </button>
          </div>
        ) : (
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', padding: '16px' }}
            className="bg-slate-50 -mx-5 px-5"
          >
            {items.map(item => (
              <ItemCard key={item.id} item={item} categoryId={categoryId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
