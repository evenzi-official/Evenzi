import { createClient } from '@/lib/supabase/client'
import { APP_HELP_CATEGORIES } from '@/lib/help/categories'
import type { HelpArticle, HelpSearchResultItem } from '@/lib/help/types'

type CategoryRow = {
  id: string
  slug: string
}

type ArticleListRow = {
  id: string
  slug: string
  question: string
  sort_order: number
}

type ArticleDetailRow = {
  id: string
  slug: string
  question: string
  answer: string
  updated_at: string
  category: {
    slug: string
    name: string
  } | null
}

/** Published article counts per app category slug. null = fetch failed. */
export async function fetchCategoryCounts(): Promise<Record<string, number> | null> {
  try {
    const supabase = createClient()
    const { data: cats, error: catErr } = await supabase
      .schema('config')
      .from('faq_categories')
      .select('id, slug')
      .eq('audience', 'app')
      .eq('enabled', true)

    if (catErr || !cats) {
      console.error('help panel category counts failed:', catErr?.message)
      return null
    }

    const rows = cats as CategoryRow[]
    const idToSlug = new Map(rows.map((c) => [c.id, c.slug]))
    const ids = rows.map((c) => c.id)
    const counts: Record<string, number> = {}
    for (const c of APP_HELP_CATEGORIES) counts[c.slug] = 0

    if (ids.length === 0) return counts

    const { data: articles, error: artErr } = await supabase
      .schema('config')
      .from('faq_articles')
      .select('category_id')
      .eq('status', 'published')
      .in('category_id', ids)

    if (artErr) {
      console.error('help panel article counts failed:', artErr.message)
      return null
    }

    for (const row of articles ?? []) {
      const slug = idToSlug.get((row as { category_id: string }).category_id)
      if (slug) counts[slug] = (counts[slug] ?? 0) + 1
    }
    return counts
  } catch (err) {
    console.error('help panel category counts error:', err)
    return null
  }
}

export async function fetchCategoryArticles(
  categorySlug: string
): Promise<{ description: string; articles: Array<{ id: string; slug: string; question: string }>; total: number } | null> {
  try {
    const supabase = createClient()
    const { data: cat, error: catErr } = await supabase
      .schema('config')
      .from('faq_categories')
      .select('id, description')
      .eq('audience', 'app')
      .eq('slug', categorySlug)
      .eq('enabled', true)
      .maybeSingle()

    if (catErr || !cat) {
      if (catErr) console.error('help panel category lookup failed:', catErr.message)
      return null
    }

    const { data, error } = await supabase
      .schema('config')
      .from('faq_articles')
      .select('id, slug, question, sort_order')
      .eq('category_id', (cat as { id: string }).id)
      .eq('status', 'published')
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('help panel category articles failed:', error.message)
      return null
    }

    const rows = (data ?? []) as ArticleListRow[]
    return {
      description: (cat as { description: string }).description ?? '',
      articles: rows.map((a) => ({ id: a.id, slug: a.slug, question: a.question })),
      total: rows.length,
    }
  } catch (err) {
    console.error('help panel category articles error:', err)
    return null
  }
}

export async function fetchPublishedArticle(slug: string): Promise<HelpArticle | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .schema('config')
      .from('faq_articles')
      .select(
        'id, slug, question, answer, updated_at, category:faq_categories!inner(slug, name)'
      )
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle()

    if (error) {
      console.error('help panel article fetch failed:', error.message)
      return null
    }
    if (!data) return null

    const row = data as unknown as ArticleDetailRow
    if (!row.category) return null

    return {
      id: row.id,
      slug: row.slug,
      question: row.question,
      answer: row.answer,
      categorySlug: row.category.slug,
      categoryName: row.category.name,
      updatedAt: row.updated_at,
    }
  } catch (err) {
    console.error('help panel article fetch error:', err)
    return null
  }
}

export type SearchResponse = {
  results: HelpSearchResultItem[]
  confident: boolean
  queryRef: string | null
}

export async function searchHelp(
  q: string,
  signal: AbortSignal
): Promise<SearchResponse> {
  const res = await fetch('/api/help/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q }),
    signal,
  })
  if (!res.ok) {
    throw new Error('search failed')
  }
  return (await res.json()) as SearchResponse
}

export async function submitFeedback(articleSlug: string, helpful: boolean): Promise<void> {
  await fetch('/api/help/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ articleSlug, helpful }),
  })
}

export async function patchQueryOutcome(
  ref: string,
  patch: { resolved?: boolean; escalated?: boolean }
): Promise<void> {
  await fetch(`/api/help/queries/${encodeURIComponent(ref)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
}

export function formatHelpDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

export function truncateMiddle(text: string, max = 60): string {
  if (text.length <= max) return text
  const keep = max - 1
  const left = Math.ceil(keep / 2)
  const right = Math.floor(keep / 2)
  return `${text.slice(0, left)}…${text.slice(-right)}`
}

export function showHelpToast(message: string): void {
  const w = window as Window & {
    evenzi?: { toast?: (m: string) => void; showToast?: (m: string) => void }
  }
  if (w.evenzi?.toast) w.evenzi.toast(message)
  else if (w.evenzi?.showToast) w.evenzi.showToast(message)
}
