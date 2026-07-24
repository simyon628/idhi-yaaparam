import { NextResponse } from 'next/server';
import { searchColleges } from '@/lib/collegeSearch';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q') || '';
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '50', 10);

        const result = searchColleges(query, page, limit);

        return NextResponse.json(result, {
            headers: {
                // Cache search queries for 1 hour at edge CDN
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=59'
            }
        });
    } catch (error) {
        console.error('Error searching colleges:', error);
        return NextResponse.json({ error: 'Failed to search colleges' }, { status: 500 });
    }
}
