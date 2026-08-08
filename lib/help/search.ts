import type { HelpSearchRow, HelpSearchResult } from './types'

/**
 * Minimum combined score for a result to be shown.
 *
 * On the verified corpus the correct answer scored above 1.0 while every
 * unrelated article scored below 0.45. Showing weak results is worse than
 * showing none: it teaches the user that search does not work here and it
 * suppresses the escalation path they actually need. See spec section 6.5.
 *
 * Calibrate against real help_queries rows during the dogfood week.
 */
export const HELP_CONFIDENCE_THRESHOLD = 0.8

/** Maximum characters accepted from the search box. Mirrors the DB CHECK. */
export const HELP_QUERY_MAX_LENGTH = 300

/** Minimum characters before a search fires at all. */
export const HELP_QUERY_MIN_LENGTH = 3

export function shapeSearchResults(rows: HelpSearchRow[]): HelpSearchResult {
  const kept = rows.filter((r) => r.combined >= HELP_CONFIDENCE_THRESHOLD)
  return {
    results: kept.map((r) => ({
      id: r.id,
      slug: r.slug,
      question: r.question,
      categorySlug: r.category_slug,
      categoryName: r.category_name,
    })),
    confident: kept.length > 0,
    topScore: rows.length > 0 ? rows[0].combined : null,
    resultCount: kept.length,
  }
}
