export type HelpAudience = 'public' | 'app'

export interface HelpSearchRow {
  id: string
  slug: string
  question: string
  category_slug: string
  category_name: string
  fts_score: number
  trgm_score: number
  combined: number
}

export interface HelpSearchResultItem {
  id: string
  slug: string
  question: string
  categorySlug: string
  categoryName: string
}

export interface HelpSearchResult {
  results: HelpSearchResultItem[]
  confident: boolean
  topScore: number | null
  resultCount: number
}

export interface HelpCategory {
  slug: string
  name: string
  description: string
  iconName: string
  articleCount: number
}

export interface HelpArticle {
  id: string
  slug: string
  question: string
  answer: string
  categorySlug: string
  categoryName: string
  updatedAt: string
}
