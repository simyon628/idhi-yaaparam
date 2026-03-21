import { Firestore, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

let cachedItems: any[] = [];
let cacheTime = 0;
let cacheCollege = '';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getCachedItems = async (db: Firestore, college: string): Promise<any[]> => {
  const now = Date.now();
  if (
    cachedItems.length > 0 &&
    cacheCollege === college &&
    now - cacheTime < CACHE_DURATION
  ) {
    return cachedItems; // return instantly from cache
  }

  const q = query(
    collection(db, 'listings'),
    where('college', '==', college),
    where('status', '==', 'available'),
    orderBy('createdAt', 'desc'),
    limit(100)
  );

  const snap = await getDocs(q);
  cachedItems = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
  cacheTime = now;
  cacheCollege = college;
  return cachedItems;
};

/** Call this to force-invalidate the cache (e.g. after a new listing is created). */
export const invalidateItemsCache = () => {
  cachedItems = [];
  cacheTime = 0;
  cacheCollege = '';
};
