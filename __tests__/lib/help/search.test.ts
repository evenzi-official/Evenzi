import { describe, it, expect } from 'vitest'
import {
  HELP_CONFIDENCE_THRESHOLD,
  shapeSearchResults,
} from '@/lib/help/search'
import type { HelpSearchRow } from '@/lib/help/types'

function row(over: Partial<HelpSearchRow> = {}): HelpSearchRow {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    slug: 'why-no-invitation',
    question: 'Why didn’t my guest get their invitation?',
    category_slug: 'managing-guests',
    category_name: 'Managing Guests',
    fts_score: 0.49,
    trgm_score: 0.55,
    combined: 1.53,
    ...over,
  }
}

describe('HELP_CONFIDENCE_THRESHOLD', () => {
  it('is 0.8, the value the measured separation supports', () => {
    expect(HELP_CONFIDENCE_THRESHOLD).toBe(0.8)
  })
})

describe('shapeSearchResults', () => {
  it('marks a confident result set as confident', () => {
    const out = shapeSearchResults([row()])
    expect(out.confident).toBe(true)
    expect(out.results).toHaveLength(1)
    expect(out.topScore).toBe(1.53)
  })

  it('is not confident when the best score is below the threshold', () => {
    const out = shapeSearchResults([row({ combined: 0.43 })])
    expect(out.confident).toBe(false)
    expect(out.results).toHaveLength(0)
  })

  it('drops individual rows below the threshold but keeps those above', () => {
    const out = shapeSearchResults([row({ combined: 1.53 }), row({ combined: 0.2, slug: 'weak' })])
    expect(out.results.map((r) => r.slug)).toEqual(['why-no-invitation'])
  })

  it('handles an empty row set without throwing', () => {
    const out = shapeSearchResults([])
    expect(out.confident).toBe(false)
    expect(out.results).toEqual([])
    expect(out.topScore).toBeNull()
  })

  it('reports resultCount as the number of rows shown, not rows returned', () => {
    const out = shapeSearchResults([row({ combined: 1.5 }), row({ combined: 0.1, slug: 'weak' })])
    expect(out.resultCount).toBe(1)
  })
})
