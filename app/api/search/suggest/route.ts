import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { SearchSuggestionResponse } from '@/lib/types';
import { CATEGORIES } from '@/components/ui/CategoryGrid';

const COMMON_TERMS = [
    { text: "Calculator", category: "Calculators", type: "product", icon: "🔢" },
    { text: "Casio fx991", category: "Calculators", type: "product", icon: "🔢" },
    { text: "Drafter", category: "Lab Gear", type: "product", icon: "📏" },
    { text: "Lab Coat", category: "Lab Gear", type: "product", icon: "🧥" },
    { text: "Arduino", category: "Electronics", type: "product", icon: "🔋" },
    { text: "Cycle", category: "Transport", type: "product", icon: "🚲" },
    { text: "Books", category: "Books & Notes", type: "category", icon: "📘" },
];

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const q = searchParams.get('q')?.toLowerCase() || '';
        const collegeId = searchParams.get('collegeId');

        if (!q || q.length < 1) {
            return NextResponse.json({ suggestions: [] });
        }

        let suggestions: SearchSuggestionResponse['suggestions'] = [];

        // 1. Static/Trained Suggestions (super fast)
        // Sort matches by: StartsWith first, then Includes
        const staticMatches = COMMON_TERMS
            .filter(t => t.text.toLowerCase().includes(q))
            .sort((a, b) => {
                const aLower = a.text.toLowerCase();
                const bLower = b.text.toLowerCase();
                const aStarts = aLower.startsWith(q) ? 1 : 0;
                const bStarts = bLower.startsWith(q) ? 1 : 0;
                return bStarts - aStarts; // Prefix matches first
            });
        suggestions.push(...staticMatches.map(s => ({
            text: s.text,
            category: s.category,
            type: s.type as any,
            icon: s.icon
        })));

        // 2. Category matches
        const catMatches = CATEGORIES.filter(c => c.name.toLowerCase().includes(q));
        suggestions.push(...catMatches.map(c => ({
            text: c.name,
            category: c.name,
            type: "category" as any,
            icon: "📂"
        })));

        // 3. Dynamic Matches from DB (we limit heavily for speed)
        if (collegeId && suggestions.length < 5) {
            const rentalsRef = collection(db!, 'rentals');
            // Firebase doesn't support generic string contains, so we fetch recent and filter in-memory for this demo.
            // In a real ES implementation, this is an edge_ngram query.
            const qRef = query(rentalsRef, where('collegeId', '==', collegeId), where('status', '==', 'available'), limit(20));
            const snapshot = await getDocs(qRef);
            
            const dbMatches = new Set<string>();
            snapshot.docs.forEach(doc => {
                const name = doc.data().itemName as string;
                if (name && name.toLowerCase().includes(q)) {
                    dbMatches.add(name);
                }
            });

            const uniqueDb = Array.from(dbMatches)
                .filter(name => !suggestions.some(s => s.text === name))
                .slice(0, 5);

            suggestions.push(...uniqueDb.map(name => ({
                text: name,
                category: "Items",
                type: "product" as any,
                icon: "📦"
            })));
        }

        // Return top 8
        const response: SearchSuggestionResponse = {
            suggestions: suggestions.slice(0, 8)
        };

        return NextResponse.json(response);

    } catch (error) {
        console.error("Suggest error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
