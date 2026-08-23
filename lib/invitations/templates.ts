export interface TemplateRow { id: string; slug: string }

export function buildTemplateMaps(rows: TemplateRow[]): {
  bySlug: Record<string, string>
  bySlugReverse: Record<string, string>
} {
  const bySlug: Record<string, string> = {}
  const bySlugReverse: Record<string, string> = {}
  for (const r of rows) { bySlug[r.slug] = r.id; bySlugReverse[r.id] = r.slug }
  return { bySlug, bySlugReverse }
}

export function idForTemplateSlug(slug: string, bySlug: Record<string, string>): string | null {
  return bySlug[slug] ?? null
}

export function slugForTemplateId(id: string, bySlugReverse: Record<string, string>): string | null {
  return bySlugReverse[id] ?? null
}
