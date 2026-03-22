import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = (searchParams.get('q') || '').toLowerCase().trim()
    const collegeId = searchParams.get('collegeId') || ''
    const mode = searchParams.get('mode') || 'all'
    const categoryFilter = searchParams.get('categoryId') || ''
    const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : null

    if (!collegeId) {
      return NextResponse.json({ results: [], totalCount: 0, suggestions: [] })
    }

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    if (!projectId) {
      return NextResponse.json({ results: [], totalCount: 0, suggestions: [] })
    }

    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`

    const body = {
      structuredQuery: {
        from: [{ collectionId: 'rentals' }],
        where: {
          compositeFilter: {
            op: 'AND',
            filters: [
              {
                fieldFilter: {
                  field: { fieldPath: 'collegeId' },
                  op: 'EQUAL',
                  value: { stringValue: collegeId },
                },
              },
              {
                fieldFilter: {
                  field: { fieldPath: 'status' },
                  op: 'EQUAL',
                  value: { stringValue: 'available' },
                },
              },
            ],
          },
        },
        limit: 100,
      },
    }

    const firestoreRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!firestoreRes.ok) {
      const err = await firestoreRes.text()
      console.error('Firestore REST error:', err)
      return NextResponse.json({ results: [], totalCount: 0, suggestions: [] })
    }

    const data = await firestoreRes.json()

    const results: any[] = []
    for (const item of data) {
      if (!item.document) continue
      const fields = item.document.fields || {}
      const id = item.document.name.split('/').pop()

      const doc: any = { id }
      for (const [key, val] of Object.entries(fields) as any) {
        if (val.stringValue !== undefined) doc[key] = val.stringValue
        else if (val.integerValue !== undefined) doc[key] = parseInt(val.integerValue)
        else if (val.doubleValue !== undefined) doc[key] = val.doubleValue
        else if (val.booleanValue !== undefined) doc[key] = val.booleanValue
        else if (val.timestampValue !== undefined) doc[key] = val.timestampValue
        else if (val.nullValue !== undefined) doc[key] = null
        else if (val.arrayValue !== undefined) doc[key] = []
      }
      results.push(doc)
    }

    let filtered = results

    // Filter by listing mode
    if (mode && mode !== 'all') {
      filtered = filtered.filter((item) => item.listingType === mode)
    }

    // Filter by categoryId
    if (categoryFilter) {
      filtered = filtered.filter((item) => item.categoryId === categoryFilter)
    }

    // Filter by max price
    if (maxPrice) {
      filtered = filtered.filter((item) => (item.pricePerHour || 0) <= maxPrice)
    }

    // Text search filter
    if (q) {
      filtered = filtered.filter((item) => {
        const text = [
          item.itemName || '',
          item.categoryId || '',
          item.description || '',
          item.block || '',
          item.college || '',
        ].join(' ').toLowerCase()
        return text.includes(q)
      })
    }

    return NextResponse.json({
      results: filtered,
      totalCount: filtered.length,
      suggestions: [],
    })

  } catch (error: any) {
    console.error('Search error:', error)
    return NextResponse.json(
      { results: [], totalCount: 0, suggestions: [] },
      { status: 500 }
    )
  }
}
