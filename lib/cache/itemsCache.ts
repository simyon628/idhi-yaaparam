import { 
  collection, query, where, 
  getDocs, limit, orderBy,
  Firestore 
} from 'firebase/firestore'

interface CacheEntry {
  data: any[]
  timestamp: number
}

const cache: Record<string, CacheEntry> = {}
const TTL = 5 * 60 * 1000 // 5 minutes

export const getCachedRentals = async (
  db: Firestore,
  collegeId: string
): Promise<any[]> => {
  if (!db || !collegeId) return []
  
  const key = `rentals_${collegeId}`
  const now = Date.now()
  
  // Return cached data instantly if fresh
  if (cache[key] && now - cache[key].timestamp < TTL) {
    return cache[key].data // <50ms - from memory!
  }
  
  // Fetch from Firebase only when cache expired
  const snap = await getDocs(query(
    collection(db, 'rentals'),
    where('collegeId', '==', collegeId),
    where('status', '==', 'available'),
    orderBy('createdAt', 'desc'),
    limit(100)
  ))
  
  const data = snap.docs.map(d => ({ 
    id: d.id, ...d.data() 
  }))
  
  // Store in memory cache
  cache[key] = { data, timestamp: now }
  return data
}

// Access cache instantaneously (synchronously)
export const getCachedRentalsSync = (collegeId: string): any[] | null => {
  if (!collegeId) return null
  const key = `rentals_${collegeId}`
  const now = Date.now()
  if (cache[key] && now - cache[key].timestamp < TTL) {
    return cache[key].data
  }
  return null
}

// Call this on home page load to warm cache
export const prefetchRentals = (
  db: Firestore, 
  collegeId: string
) => {
  getCachedRentals(db, collegeId) // fire and forget
}

// Update the cache entry manually (synchronously)
export const updateCachedRentalsSync = (collegeId: string, data: any[]) => {
  if (!collegeId) return
  const key = `rentals_${collegeId}`
  cache[key] = { data, timestamp: Date.now() }
}
