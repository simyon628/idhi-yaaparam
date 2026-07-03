import { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '@/lib/firebase';
import {
  collection, query, where, orderBy, limit,
  startAfter, getDocs, QueryDocumentSnapshot, DocumentData
} from 'firebase/firestore';
import { Listing } from '@/lib/types';
import { getCachedRentalsSync, updateCachedRentalsSync } from '@/lib/cache/itemsCache';

const PAGE_SIZE = 12;

export function useInfiniteItems(collegeId: string | undefined, categoryId?: string) {
  // Seed from memory cache instantly (0ms perceived load)
  const [items, setItems] = useState<Listing[]>(() => {
    if (!collegeId) return [];
    const cached = getCachedRentalsSync(collegeId);
    if (!cached) return [];
    // Filter by category if needed
    if (categoryId && categoryId !== 'all') {
      return cached.filter((i: any) => i.categoryId === categoryId) as Listing[];
    }
    return cached.slice(0, PAGE_SIZE) as Listing[];
  });

  const [isLoading, setIsLoading] = useState(() => {
    // Only show skeleton if no cache exists
    if (!collegeId) return false;
    return !getCachedRentalsSync(collegeId);
  });
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const lastDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
  const isFetchingRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const fetchPage = useCallback(async (isFirst: boolean) => {
    if (!collegeId || !db || isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (isFirst) {
      setIsLoading(true);
      lastDocRef.current = null;
    } else {
      if (!hasMore || !lastDocRef.current) {
        isFetchingRef.current = false;
        return;
      }
      setIsLoadingMore(true);
    }

    try {
      let q = query(
        collection(db as any, 'rentals'),
        where('collegeId', '==', collegeId),
        where('status', '==', 'available')
      );

      if (categoryId && categoryId !== 'all') {
        if (categoryId === 'electronics') {
          q = query(q, where('categoryId', 'in', ['electronics', 'laptop', 'camera']));
        } else if (categoryId === 'academic') {
          q = query(q, where('categoryId', 'in', ['geometry', 'books', 'drafter', 'calculator', 'lab-coat', 'stationery']));
        } else {
          q = query(q, where('categoryId', '==', categoryId));
        }
      }

      q = query(q, orderBy('createdAt', 'desc'), limit(PAGE_SIZE));

      if (!isFirst && lastDocRef.current) {
        q = query(q, startAfter(lastDocRef.current));
      }

      const snap = await getDocs(q);
      const batch = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Listing[];

      lastDocRef.current = snap.docs[snap.docs.length - 1] || null;
      setHasMore(snap.docs.length === PAGE_SIZE);

      setItems(prev => {
        if (isFirst) return batch;
        const ids = new Set(prev.map(i => i.id));
        return [...prev, ...batch.filter(i => !ids.has(i.id))];
      });

      // Update shared cache if fetching for 'all' category
      if (!categoryId || categoryId === 'all') {
        updateCachedRentalsSync(collegeId, batch);
      }

      setError(null);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [collegeId, categoryId, hasMore]);

  // Initial load
  useEffect(() => {
    lastDocRef.current = null;
    setHasMore(true);
    setItems([]);
    fetchPage(true);
  }, [collegeId, categoryId]);

  // Intersection Observer for automatic infinite scroll
  const setSentinel = useCallback((el: HTMLDivElement | null) => {
    if (observerRef.current) observerRef.current.disconnect();
    if (!el) return;
    sentinelRef.current = el;
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          fetchPage(false);
        }
      },
      { rootMargin: '200px' } // pre-load 200px before reaching bottom
    );
    observerRef.current.observe(el);
  }, [hasMore, isLoadingMore, isLoading, fetchPage]);

  return {
    items,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    setSentinel, // attach this ref to the sentinel div at the bottom of your list
    loadMore: () => fetchPage(false),
  };
}
