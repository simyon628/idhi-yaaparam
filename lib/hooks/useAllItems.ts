import { useEffect, useState, useRef, useMemo } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { Listing } from '@/lib/types'
import { getCachedRentalsSync, updateCachedRentalsSync } from '@/lib/cache/itemsCache'

/**
 * Real-time items hook using onSnapshot.
 * Automatically updates when Firestore data changes — no manual cache invalidation needed.
 * Filters by collegeId (always) and status=available.
 */
export function useAllItems(collegeId: string | undefined, categoryId?: string, shouldFetch = true) {
  const [data, setData] = useState<Listing[] | undefined>(() => {
    if (collegeId) {
      const cached = getCachedRentalsSync(collegeId);
      if (cached) return cached as Listing[];
    }
    return undefined;
  })
  const [isLoading, setIsLoading] = useState(() => {
    if (collegeId && getCachedRentalsSync(collegeId)) return false;
    return false;
  })
  const [error, setError] = useState<Error | null>(null)
  const unsubRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    // Clean up previous listener
    if (unsubRef.current) {
      unsubRef.current()
      unsubRef.current = null
    }

    if (!shouldFetch || !collegeId || !db) {
      setData([])
      setIsLoading(false)
      return
    }

    // Only set loading if not already cached
    const isCached = !!getCachedRentalsSync(collegeId);
    if (!isCached) {
        setIsLoading(true)
    }

    const q = query(
      collection(db as any, 'rentals'),
      where('collegeId', '==', collegeId),
      where('status', '==', 'available'),
      orderBy('createdAt', 'desc'),
      limit(30)
    )

    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Listing[]
        updateCachedRentalsSync(collegeId, items)
        setData(items)
        setIsLoading(false)
        setError(null)
      },
      (err) => {
        console.error('useAllItems onSnapshot error:', err)
        setError(err)
        setIsLoading(false)
      }
    )

    unsubRef.current = unsub
    return () => {
      unsub()
      unsubRef.current = null
    }
  }, [collegeId, shouldFetch])

  // Filter local category if requested
  const filteredData = useMemo(() => {
    if (!data) return data;
    if (categoryId) return data.filter(item => item.categoryId === categoryId);
    return data;
  }, [data, categoryId]);

  return { data: filteredData, isLoading, error }
}
