import useSWR from 'swr'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { Listing } from '@/lib/types'

export function useAllItems(collegeId: string | undefined, categoryId?: string, shouldFetch = true) {
  return useSWR(
    (shouldFetch && collegeId) ? `items_${collegeId}_all` : null,
    async () => {
      if (!db) throw new Error("Firebase not initialized");
      
      const snap = await getDocs(
        query(
          collection(db as any, 'rentals'),
          where('collegeId', '==', collegeId),
          where('status', '==', 'available')
        )
      )
      return snap.docs.map(d => ({ id: d.id, ...d.data() })) as Listing[]
    },
    {
      revalidateOnFocus: false,
      revalidateOnMount: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000 // 5 minutes cache
    }
  )
}
