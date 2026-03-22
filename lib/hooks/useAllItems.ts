import { useEffect, useState, useRef } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { Listing } from '@/lib/types'

/**
 * Real-time items hook using onSnapshot.
 * Automatically updates when Firestore data changes — no manual cache invalidation needed.
 * Filters by collegeId (always) and status=available.
 */
export function useAllItems(collegeId: string | undefined, categoryId?: string, shouldFetch = true) {
  const [data, setData] = useState<Listing[] | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
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

    setIsLoading(true)

    const q = query(
      collection(db as any, 'rentals'),
      where('collegeId', '==', collegeId),
      where('status', '==', 'available')
    )

    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Listing[]
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

  return { data, isLoading, error }
}
