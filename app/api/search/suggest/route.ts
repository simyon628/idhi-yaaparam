import { NextResponse } from 'next/server'
import { CATEGORIES } from '@/components/ui/CategoryGrid'
import { SearchSuggestionResponse } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

const COMMON_TERMS = [
  { text: 'Calculator', category: 'Calculators', type: 'product', icon: '🔢' },
  { text: 'Casio fx991', category: 'Calculators', type: 'product', icon: '🔢' },
  { text: 'Drafter', category: 'Lab Gear', type: 'product', icon: '📏' },
  { text: 'Lab Coat', category: 'Lab Gear', type: 'product', icon: '🧥' },
  { text: 'Arduino', category: 'Electronics', type: 'product', icon: '🔋' },
  { text: 'Cycle', category: 'Transport', type: 'product', icon: '🚲' },
  { text: 'Books', category: 'Books & Notes', type: 'category', icon: '📘' },
]

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.toLowerCase() || ''
    const collegeId = searchParams.get('collegeId')

    if (!q || q.length < 1) {
      return NextResponse.json({ suggestions: [] })
    }

    let suggestions: SearchSuggestionResponse['suggestions'] = []

    // 1. Static suggestions (instant)
    const staticMatches = COMMON_TERMS
      .filter(t => t.text.toLowerCase().includes(q))
      .sort((a, b) => {
        const aStarts = a.text.toLowerCase().startsWith(q) ? 1 : 0
        const bStarts = b.text.toLowerCase().startsWith(q) ? 1 : 0
        return bStarts - aStarts
      })
    suggestions.push(...staticMatches.map(s => ({
      text: s.text,
      category: s.category,
      type: s.type as any,
      icon: s.icon,
    })))

    // 2. Category name matches
    const catMatches = CATEGORIES.filter(c => c.name.toLowerCase().includes(q))
    suggestions.push(...catMatches.map(c => ({
      text: c.name,
      category: c.name,
      type: 'category' as any,
      icon: '📂',
    })))

    // 3. Dynamic matches from Firestore REST API
    if (collegeId && suggestions.length < 5) {
      try {
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
        if (projectId) {
          const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`
          const body = {
            structuredQuery: {
              from: [{ collectionId: 'rentals' }],
              where: {
                compositeFilter: {
                  op: 'AND',
                  filters: [
                    { fieldFilter: { field: { fieldPath: 'collegeId' }, op: 'EQUAL', value: { stringValue: collegeId } } },
                    { fieldFilter: { field: { fieldPath: 'status' }, op: 'EQUAL', value: { stringValue: 'available' } } },
                  ],
                },
              },
              limit: 20,
            },
          }

          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })

          if (res.ok) {
            const data = await res.json()
            const dbMatches = new Set<string>()
            for (const item of data) {
              if (!item.document) continue
              const name = item.document.fields?.itemName?.stringValue
              if (name && name.toLowerCase().includes(q)) {
                dbMatches.add(name)
              }
            }

            const uniqueDb = Array.from(dbMatches)
              .filter(name => !suggestions.some(s => s.text === name))
              .slice(0, 5)

            suggestions.push(...uniqueDb.map(name => ({
              text: name,
              category: 'Items',
              type: 'product' as any,
              icon: '📦',
            })))
          }
        }
      } catch (dbErr) {
        console.error('Suggest DB error:', dbErr)
      }
    }

    const response: SearchSuggestionResponse = {
      suggestions: suggestions.slice(0, 8),
    }
    return NextResponse.json(response)

  } catch (error) {
    console.error('Suggest error:', error)
    return NextResponse.json({ suggestions: [] })
  }
}
