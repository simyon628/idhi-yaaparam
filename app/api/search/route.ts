import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { Listing, SearchFilter, SearchResponse } from '@/lib/types';

// Constants for Ranking
const WEIGHTS = {
    TEXT: 0.35,
    PROXIMITY: 0.25,
    POPULARITY: 0.15,
    RATING: 0.15,
    FRESHNESS: 0.10
};

// Simple Haversine distance
function getDistanceInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// BM25-like rough text score
function calculateTextScore(queryStr: string, item: Listing): number {
    if (!queryStr) return 1.0;
    
    const terms = queryStr.toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return 1.0;

    let totalScore = 0;
    const searchSpace = [
        { text: item.itemName?.toLowerCase() || '', weight: 4.0 }, // Increased weight for item name
        { text: item.categoryId?.toLowerCase() || '', weight: 1.5 },
        { text: item.department?.toLowerCase() || '', weight: 1.0 },
        { text: item.block?.toLowerCase() || '', weight: 1.0 },
    ];

    for (const term of terms) {
        let termScore = 0;
        for (const field of searchSpace) {
            if (field.text === term) {
                termScore += field.weight * 2.0; // Exact match boost
            } else if (field.text.startsWith(term)) {
                termScore += field.weight * 1.5; // Prefix match boost
            } else if (field.text.includes(term)) {
                termScore += field.weight; // Partial match
            } else if (term.length > 2 && field.text.includes(term.slice(0, 3))) {
                termScore += field.weight * 0.3; // Fuzzy prefix
            }
        }
        totalScore += termScore;
    }

    // Normalization logic: item name carries the most importance.
    return Math.min(totalScore / (terms.length * 5.0), 1.0);
}

function calculateProximityScore(userLat?: number, userLng?: number, itemLat?: number, itemLng?: number): number {
    if (!userLat || !userLng || !itemLat || !itemLng) return 0.5; // Neutral if no data
    const distanceKm = getDistanceInKm(userLat, userLng, itemLat, itemLng);
    // Exponential decay: e^(-lambda * distance). Lambda 0.2 => 10km = 0.13
    return Math.exp(-0.2 * distanceKm);
}

function calculateFreshnessScore(createdAt: any): number {
    if (!createdAt) return 0.5;
    const timeToMillis = typeof createdAt.toMillis === 'function' ? createdAt.toMillis() : 
                        (createdAt instanceof Date ? createdAt.getTime() : Date.now());
    const daysOld = (Date.now() - timeToMillis) / (1000 * 60 * 60 * 24);
    // Decay: today=1.0, 10 days = 0.36
    return Math.max(0.1, Math.exp(-0.1 * daysOld));
}

// Emulate popularity & rating since it's not fully populated yet
function calculatePopularityScore(item: any): number {
    const clicks = item.views || 0;
    return Math.min(Math.log10(clicks + 1) / 3.0, 1.0); // Assuming 1000 clicks = max(1.0)
}

function calculateRatingScore(rating?: number): number {
    return (rating || 2.5) / 5.0; // Default to mid-tier
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        
        const q = searchParams.get('q') || '';
        const mode = searchParams.get('mode') || 'rent';
        const collegeId = searchParams.get('collegeId');
        
        if (!collegeId) {
            return NextResponse.json({ error: 'Missing collegeId' }, { status: 400 });
        }

        const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : undefined;
        const lng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : undefined;

        // Parse Filters
        let filters: SearchFilter = {};
        try {
            const filtersParam = searchParams.get('filters');
            if (filtersParam) filters = JSON.parse(filtersParam);
        } catch (e) {
            console.warn("Invalid filters param");
        }

        // 1. Fetch Candidates from Firebase based on Mode & College
        // We use coarse filters to reduce read operations
        const rentalsRef = collection(db!, 'rentals');
        let qRef = query(
            rentalsRef, 
            where('collegeId', '==', collegeId),
            where('status', '==', 'available') // Never show unavailable
        );
        
        const snapshot = await getDocs(qRef);
        let candidates: Listing[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing));
        
        // Mode filter: Default to rent if mapping not rigorous in DB, but normally strict
        candidates = candidates.filter(item => (item.listingType || 'rent') === mode);

        // 2. Hard Filters (Zero Tolerance)
        if (filters.categoryId && filters.categoryId !== "All") {
            candidates = candidates.filter(item => item.categoryId === filters.categoryId);
        }
        if (filters.maxPrice !== undefined) {
            candidates = candidates.filter(item => item.pricePerHour <= filters.maxPrice!);
        }
        if (filters.condition) {
            candidates = candidates.filter(item => item.condition === filters.condition);
        }

        // 3. Search Relevance (if query exists) & Ranking
        // Calculate FINAL_SCORE
        const rankedResults = candidates.map(item => {
            const textScore = calculateTextScore(q, item);
            const proxScore = calculateProximityScore(lat, lng, item.ownerLocation?.lat, item.ownerLocation?.lng);
            const popScore = calculatePopularityScore(item);
            const rateScore = calculateRatingScore((item as any).sellerRating); // Assuming sellerRating exists
            const freshScore = calculateFreshnessScore(item.createdAt);

            const finalScore = 
                (WEIGHTS.TEXT * textScore) + 
                (WEIGHTS.PROXIMITY * proxScore) +
                (WEIGHTS.POPULARITY * popScore) +
                (WEIGHTS.RATING * rateScore) +
                (WEIGHTS.FRESHNESS * freshScore);

            return { item, finalScore, textScore };
        });

        // If a query exists, filter out zero text score items (irrelevant)
        let filteredRanked = rankedResults;
        if (q.trim()) {
            filteredRanked = rankedResults.filter(r => r.textScore > 0);
        }

        // Apply fallback if 0 results
        let isFallback = false;
        if (filteredRanked.length === 0 && q.trim()) {
            isFallback = true;
            // Fallback: Relax text score limit, just show trending/close by
            filteredRanked = rankedResults.sort((a,b) => b.finalScore - a.finalScore).slice(0, 10);
        }

        // Sort by final score or user requested sort
        if (filters.sort === 'price_asc') {
            filteredRanked.sort((a, b) => a.item.pricePerHour - b.item.pricePerHour);
        } else if (filters.sort === 'price_desc') {
            filteredRanked.sort((a, b) => b.item.pricePerHour - a.item.pricePerHour);
        } else if (filters.sort === 'newest') {
            filteredRanked.sort((a, b) => {
                const tA = (a.item.createdAt as any)?.toMillis?.() || (a.item.createdAt as any)?.getTime?.() || 0;
                const tB = (b.item.createdAt as any)?.toMillis?.() || (b.item.createdAt as any)?.getTime?.() || 0;
                return tB - tA;
            });
        } else {
            // Default => Relevance
            filteredRanked.sort((a, b) => b.finalScore - a.finalScore);
        }

        const finalItems = filteredRanked.map(r => r.item);

        const response: SearchResponse = {
            results: finalItems,
            totalCount: finalItems.length,
            appliedFilters: filters,
            suggestions: isFallback ? ["Try broader terms", "Check spelling"] : []
        };

        return NextResponse.json(response, {
            headers: { 'Cache-Control': 'no-store' }
        });

    } catch (error) {
        console.error("Search error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
