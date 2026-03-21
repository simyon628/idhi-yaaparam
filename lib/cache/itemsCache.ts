import { Firestore, collection, query, where, limit, getDocs } from 'firebase/firestore';

let cachedItems: any[] = [];
let cacheTime = 0;
let cacheCollege = '';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getCachedItems = async (db: Firestore, collegeId: string): Promise<any[]> => {
  const now = Date.now();
  if (
    cachedItems.length > 0 &&
    cacheCollege === collegeId &&
    now - cacheTime < CACHE_DURATION
  ) {
    return cachedItems; // return instantly from cache
  }

  // Items are stored in the 'rentals' collection with 'collegeId' field
  // Avoid orderBy to skip needing a composite Firestore index
  const q = query(
    collection(db, 'rentals'),
    where('collegeId', '==', collegeId),
    where('status', '==', 'available'),
    limit(100)
  );

  const snap = await getDocs(q);
  cachedItems = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
  cacheTime = now;
  cacheCollege = collegeId;
  return cachedItems;
};

/** Call this to force-invalidate the cache (e.g. after a new listing is created). */
export const invalidateItemsCache = () => {
  cachedItems = [];
  cacheTime = 0;
  cacheCollege = '';
};
