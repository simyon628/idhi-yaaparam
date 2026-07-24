import collegesData from './colleges.json';

export interface CollegeRecord {
    id: string;
    name: string;
    acronym: string;
    state: string;
    city: string;
    address?: string;
    website?: string;
    popularityScore?: number;
    aliases?: string[];
}

const allColleges = collegesData as CollegeRecord[];

export function searchColleges(rawQuery: string, page: number = 1, limit: number = 50) {
    const query = rawQuery.trim().toLowerCase();

    // If query is empty, return top colleges sorted by popularityScore
    if (!query) {
        const startIndex = (page - 1) * limit;
        const pagedData = allColleges.slice(startIndex, startIndex + limit);
        return {
            items: pagedData,
            total: allColleges.length,
            page,
            limit,
            hasMore: startIndex + limit < allColleges.length
        };
    }

    // Split query words
    const queryWords = query.split(/\s+/).filter(Boolean);

    // Score and rank matches
    const scoredResults: { college: CollegeRecord; matchScore: number }[] = [];

    for (let i = 0; i < allColleges.length; i++) {
        const c = allColleges[i];
        const nameLower = c.name.toLowerCase();
        const acronymLower = (c.acronym || '').toLowerCase();
        const cityLower = (c.city || '').toLowerCase();
        const stateLower = (c.state || '').toLowerCase();

        let score = 0;

        // 1. Exact Acronym Match (Highest Priority) e.g., "SRKR", "SRM", "IITM"
        if (acronymLower === query) {
            score += 10000;
        } 
        // 2. Acronym Starts With Query e.g., "SR" matches "SRKR", "SRM"
        else if (acronymLower.startsWith(query)) {
            score += 5000;
        }

        // Check alias exact / prefix matches
        if (c.aliases) {
            for (const alias of c.aliases) {
                const aliasLower = alias.toLowerCase();
                if (aliasLower === query) score += 9000;
                else if (aliasLower.startsWith(query)) score += 4000;
            }
        }

        // 3. Name Starts With Query
        if (nameLower.startsWith(query)) {
            score += 3000;
        }

        // 4. Substring Match in Full Name
        if (nameLower.includes(query)) {
            score += 1500;
        }

        // 5. All query words present anywhere in (name + city + state)
        const allWordsMatch = queryWords.every(word =>
            nameLower.includes(word) ||
            cityLower.includes(word) ||
            stateLower.includes(word) ||
            acronymLower.includes(word)
        );

        if (allWordsMatch) {
            score += 1000;
        }

        // Add base popularity score weight (to favor major campuses)
        if (score > 0) {
            score += (c.popularityScore || 0);
            scoredResults.push({ college: c, matchScore: score });
        }
    }

    // Sort by matchScore descending, then by popularityScore descending, then alphabetically
    scoredResults.sort((a, b) => {
        if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
        if ((b.college.popularityScore || 0) !== (a.college.popularityScore || 0)) {
            return (b.college.popularityScore || 0) - (a.college.popularityScore || 0);
        }
        return a.college.name.localeCompare(b.college.name);
    });

    const startIndex = (page - 1) * limit;
    const pagedItems = scoredResults.slice(startIndex, startIndex + limit).map(r => r.college);

    return {
        items: pagedItems,
        total: scoredResults.length,
        page,
        limit,
        hasMore: startIndex + limit < scoredResults.length
    };
}
