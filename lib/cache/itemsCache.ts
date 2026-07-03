import {
  collection, query, where,
  getDocs, limit, orderBy,
  Firestore
} from 'firebase/firestore'

interface CacheEntry {
  data: any[]
  timestamp: number
  version: number
}

// Tiered TTL: different for first load vs refresh
const TTL_FRESH = 2 * 60 * 1000   // 2 minutes — ultra-fast first load
const TTL_STALE = 10 * 60 * 1000  // 10 minutes — stale-while-revalidate

const cache: Record<string, CacheEntry> = {}
let globalVersion = 0

/** Return cached data if fresh. Returns stale data + triggers background refresh if stale-but-valid. */
export const getCachedRentals = async (
  db: Firestore,
  collegeId: string
): Promise<any[]> => {
  if (!db || !collegeId) return []

  const key = `rentals_${collegeId}`
  const now = Date.now()
  const entry = cache[key]

  // Fresh hit — instant return
  if (entry && now - entry.timestamp < TTL_FRESH) {
    return entry.data
  }

  // Stale-while-revalidate — return stale, refresh in background
  if (entry && now - entry.timestamp < TTL_STALE) {
    _fetchAndCache(db, collegeId).catch(() => null) // background refresh
    return entry.data
  }

  // Cache miss — fetch synchronously
  return _fetchAndCache(db, collegeId)
}

async function _fetchAndCache(db: Firestore, collegeId: string): Promise<any[]> {
  try {
    const snap = await getDocs(query(
      collection(db, 'rentals'),
      where('collegeId', '==', collegeId),
      where('status', '==', 'available'),
      orderBy('createdAt', 'desc'),
      limit(120) // fetch 120 items max for the grid
    ))
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    cache[`rentals_${collegeId}`] = { data, timestamp: Date.now(), version: ++globalVersion }
    return data
  } catch {
    return cache[`rentals_${collegeId}`]?.data || []
  }
}

/** Synchronous instant read — returns null if no cache yet */
export const getCachedRentalsSync = (collegeId: string): any[] | null => {
  if (!collegeId) return null
  const entry = cache[`rentals_${collegeId}`]
  if (!entry) return null
  // Even stale cache is better than nothing
  if (Date.now() - entry.timestamp < TTL_STALE) return entry.data
  return null
}

/** Warm cache on home page load */
export const prefetchRentals = (db: Firestore, collegeId: string) => {
  getCachedRentals(db, collegeId).catch(() => null)
}

/** Update cache after real-time onSnapshot update */
export const updateCachedRentalsSync = (collegeId: string, data: any[]) => {
  if (!collegeId) return
  cache[`rentals_${collegeId}`] = { data, timestamp: Date.now(), version: ++globalVersion }
}

/** Invalidate cache for a college (after user lists new item) */
export const invalidateCache = (collegeId: string) => {
  delete cache[`rentals_${collegeId}`]
}
