import { createClient } from '@/lib/supabase/server'
import { helpCategoriesForAudience } from '@/lib/help/categories'
import { shapeSearchResults } from '@/lib/help/search'
import type {
  HelpArticle,
  HelpAudience,
  HelpCategory,
  HelpSearchResult,
  HelpSearchRow,
} from '@/lib/help/types'

type CategoryRow = {
  id: string
  slug: string
  name: string
  description: string
  icon_name: string
  display_order: number
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
    audience: HelpAudience
  } | null
}

export async function resolveHelpAudience(): Promise<{
  audience: HelpAudience
  userId: string | null
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { audience: user ? 'app' : 'public', userId: user?.id ?? null }
}

export async function listHelpCategories(
  audience: HelpAudience
): Promise<HelpCategory[]> {
  const supabase = await createClient()
  const { data: cats, error } = await supabase
    .schema('config')
    .from('faq_categories')
    .select('id, slug, name, description, icon_name, display_order')
    .eq('audience', audience)
    .eq('enabled', true)
    .order('display_order', { ascending: true })

  if (error || !cats) {
    console.error('listHelpCategories failed:', error?.message)
    // Fall back to static catalog with zero counts — never a dead end.
    return helpCategoriesForAudience(audience).map((c) => ({
      ...c,
      articleCount: 0,
    }))
  }

  const rows = cats as CategoryRow[]
  const ids = rows.map((c) => c.id)
  const counts = new Map<string, number>()

  if (ids.length > 0) {
    const { data: articles, error: artErr } = await supabase
      .schema('config')
      .from('faq_articles')
      .select('category_id')
      .eq('status', 'published')
      .in('category_id', ids)

    if (artErr) {
      console.error('listHelpCategories counts failed:', artErr.message)
    } else {
      for (const row of articles ?? []) {
        const cid = (row as { category_id: string }).category_id
        counts.set(cid, (counts.get(cid) ?? 0) + 1)
      }
    }
  }

  return rows.map((c) => ({
    slug: c.slug,
    name: c.name,
    description: c.description,
    iconName: c.icon_name,
    articleCount: counts.get(c.id) ?? 0,
  }))
}

export async function getHelpCategory(
  audience: HelpAudience,
  slug: string
): Promise<HelpCategory | null> {
  const all = await listHelpCategories(audience)
  return all.find((c) => c.slug === slug) ?? null
}

export async function listCategoryArticles(
  audience: HelpAudience,
  categorySlug: string
): Promise<Array<{ id: string; slug: string; question: string }>> {
  const supabase = await createClient()
  const { data: cat, error: catErr } = await supabase
    .schema('config')
    .from('faq_categories')
    .select('id')
    .eq('audience', audience)
    .eq('slug', categorySlug)
    .eq('enabled', true)
    .maybeSingle()

  if (catErr || !cat) {
    if (catErr) console.error('listCategoryArticles category failed:', catErr.message)
    return []
  }

  const { data, error } = await supabase
    .schema('config')
    .from('faq_articles')
    .select('id, slug, question, sort_order')
    .eq('category_id', (cat as { id: string }).id)
    .eq('status', 'published')
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('listCategoryArticles failed:', error.message)
    return []
  }

  return ((data ?? []) as ArticleListRow[]).map((a) => ({
    id: a.id,
    slug: a.slug,
    question: a.question,
  }))
}

export async function getPublishedArticle(
  slug: string
): Promise<HelpArticle | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .schema('config')
    .from('faq_articles')
    .select(
      'id, slug, question, answer, updated_at, category:faq_categories!inner(slug, name, audience)'
    )
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (error) {
    console.error('getPublishedArticle failed:', error.message)
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
}

export async function searchHelpArticles(
  audience: HelpAudience,
  q: string
): Promise<HelpSearchResult> {
  const supabase = await createClient()
  const { data, error } = await supabase.schema('config').rpc('search_faq', {
    p_query: q,
    p_audience: audience,
    p_limit: 8,
  })

  if (error) {
    console.error('searchHelpArticles failed:', error.message)
    return { results: [], confident: false, topScore: null, resultCount: 0 }
  }

  return shapeSearchResults((data ?? []) as HelpSearchRow[])
}

export function formatHelpDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

export function stripMarkdownPreview(md: string, max = 150): string {
  const plain = md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_~>#-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (plain.length <= max) return plain
  return `${plain.slice(0, max - 1).trimEnd()}…`
}
