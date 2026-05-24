import { useState, useEffect, useRef, useCallback } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, limit, startAfter, getDocs, QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { Listing } from "@/lib/types";

interface UsePaginatedItemsResult {
  data: Listing[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  error: Error | null;
  reset: () => void;
}

export function usePaginatedItems(
  collegeId: string | undefined,
  categoryId?: string,
  pageSize = 12
): UsePaginatedItemsResult {
  const [data, setData] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const lastDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
  const isFetchingRef = useRef(false);

  const reset = useCallback(() => {
    setData([]);
    setHasMore(true);
    setError(null);
    lastDocRef.current = null;
    isFetchingRef.current = false;
  }, []);

  const fetchBatch = useCallback(
    async (isFirstPage: boolean) => {
      if (!collegeId || !db) {
        setData([]);
        setIsLoading(false);
        setHasMore(false);
        return;
      }

      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      if (isFirstPage) {
        setIsLoading(true);
        lastDocRef.current = null;
      } else {
        setIsLoadingMore(true);
      }

      try {
        let q = query(
          collection(db as any, "rentals"),
          where("collegeId", "==", collegeId),
          where("status", "==", "available")
        );

        if (categoryId && categoryId !== "all") {
          if (categoryId === "electronics") {
            q = query(q, where("categoryId", "in", ["electronics", "laptop", "camera"]));
          } else if (categoryId === "academic") {
            q = query(q, where("categoryId", "in", ["geometry", "books", "drafter", "calculator", "lab-coat", "stationery"]));
          } else {
            q = query(q, where("categoryId", "==", categoryId));
          }
        }

        // Apply our compound index criteria: order by createdAt desc
        q = query(q, orderBy("createdAt", "desc"), limit(pageSize));

        if (!isFirstPage && lastDocRef.current) {
          q = query(q, startAfter(lastDocRef.current));
        }

        const snap = await getDocs(q);
        const batch = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Listing[];

        lastDocRef.current = snap.docs[snap.docs.length - 1] || null;
        setHasMore(snap.docs.length === pageSize);

        if (isFirstPage) {
          setData(batch);
        } else {
          setData((prev) => {
            const existingIds = new Set(prev.map((item) => item.id));
            const uniqueBatch = batch.filter((item) => !existingIds.has(item.id));
            return [...prev, ...uniqueBatch];
          });
        }
        setError(null);
      } catch (err: any) {
        console.error("usePaginatedItems error:", err);
        setError(err);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
        isFetchingRef.current = false;
      }
    },
    [collegeId, categoryId, pageSize]
  );

  useEffect(() => {
    reset();
    fetchBatch(true);
  }, [collegeId, categoryId, reset, fetchBatch]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading || isLoadingMore || !lastDocRef.current) return;
    await fetchBatch(false);
  }, [hasMore, isLoading, isLoadingMore, fetchBatch]);

  return {
    data,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    error,
    reset,
  };
}
