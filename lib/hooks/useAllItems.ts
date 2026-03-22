import useSWR from 'swr'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { Listing } from '@/lib/types'

export function useAllItems(collegeId: string | undefined, categoryId?: string) {
  return useSWR(
    collegeId ? `items_${collegeId}_${categoryId || 'all'}` : null,
    async () => {
      if (!db) throw new Error("Firebase not initialized");
      
      const constraints = [
        where('collegeId', '==', collegeId),
        where('status', '==', 'available')
      ];

      if (categoryId) {
        constraints.push(where('categoryId', '==', categoryId));
      }

      const snap = await getDocs(
        query(
          collection(db as any, 'rentals'),
          ...constraints
        )
      )
      return snap.docs.map(d => ({ id: d.id, ...d.data() })) as Listing[]
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000 // 5 minutes cache
    }
  )
}
