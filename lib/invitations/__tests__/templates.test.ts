import { describe, it, expect } from 'vitest'
import { buildTemplateMaps, slugForTemplateId, idForTemplateSlug } from '@/lib/invitations/templates'

const rows = [{ id: 'uuid-eternal', slug: 'eternal' }, { id: 'uuid-noir', slug: 'noir' }]

describe('template maps', () => {
  it('resolves slug to id', () => {
    const { bySlug } = buildTemplateMaps(rows)
    expect(idForTemplateSlug('noir', bySlug)).toBe('uuid-noir')
  })
  it('resolves id to slug', () => {
    const { bySlugReverse } = buildTemplateMaps(rows)
    expect(slugForTemplateId('uuid-eternal', bySlugReverse)).toBe('eternal')
  })
  it('returns null for unknown slug', () => {
    const { bySlug } = buildTemplateMaps(rows)
    expect(idForTemplateSlug('ghost', bySlug)).toBeNull()
  })
  it('returns null for unknown id', () => {
    const { bySlugReverse } = buildTemplateMaps(rows)
    expect(slugForTemplateId('uuid-ghost', bySlugReverse)).toBeNull()
  })
})
