import { describe, it, expect, vi, beforeEach } from 'vitest'

const getUser = vi.fn()
const insert = vi.fn()
const selectCount = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser },
  }),
}))

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({
    from: (table: string) => {
      if (table === 'support_tickets') {
        return {
          select: (_cols: string, opts?: { count?: string; head?: boolean }) => {
            if (opts?.head) {
              return {
                eq: () => ({
                  gte: async () => selectCount(),
                }),
              }
            }
            return {
              // unused path
            }
          },
          insert: (...args: unknown[]) => {
            insert(...args)
            return {
              select: () => ({
                single: async () => ({ data: { reference: 'EVZ-7K4M2' }, error: null }),
              }),
            }
          },
        }
      }
      throw new Error(`unexpected table ${table}`)
    },
  }),
}))

async function post(body: unknown) {
  const { POST } = await import('@/app/api/help/tickets/route')
  return POST(
    new Request('http://localhost/api/help/tickets', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  )
}

beforeEach(() => {
  getUser.mockReset()
  insert.mockReset()
  selectCount.mockReset()
  selectCount.mockResolvedValue({ count: 0, error: null })
})

describe('POST /api/help/tickets', () => {
  it('returns 401 when unauthenticated', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: { message: 'no session' } })
    const res = await post({
      email: 'a@b.com',
      message: 'x'.repeat(30),
    })
    expect(res.status).toBe(401)
    expect(insert).not.toHaveBeenCalled()
  })

  it('stores the session identity, not a client-supplied user_id', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'real-user' } }, error: null })
    await post({
      email: 'a@b.com',
      message: 'x'.repeat(30),
      user_id: 'attacker',
    })
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'real-user' })
    )
    expect(insert).toHaveBeenCalledWith(
      expect.not.objectContaining({ user_id: 'attacker' })
    )
  })

  it('rejects a message of 19 characters', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u' } }, error: null })
    const res = await post({
      email: 'a@b.com',
      message: 'x'.repeat(19),
    })
    expect(res.status).toBe(400)
    expect(insert).not.toHaveBeenCalled()
  })

  it('strips the query string from page_url', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u' } }, error: null })
    await post({
      email: 'a@b.com',
      message: 'x'.repeat(30),
      pageUrl: 'https://evenzii.com/help?q=9876543210',
    })
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ page_url: 'https://evenzii.com/help' })
    )
  })

  it('returns 429 on the sixth ticket in an hour', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u' } }, error: null })
    selectCount.mockResolvedValue({ count: 5, error: null })
    const res = await post({
      email: 'a@b.com',
      message: 'x'.repeat(30),
    })
    expect(res.status).toBe(429)
    expect(insert).not.toHaveBeenCalled()
  })

  it('returns a reference on success', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u' } }, error: null })
    const res = await post({
      email: 'a@b.com',
      message: 'x'.repeat(30),
    })
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.reference).toBe('EVZ-7K4M2')
  })

  it('builds context from the allow-list only', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u' } }, error: null })
    await post({
      email: 'a@b.com',
      message: 'x'.repeat(30),
      articleSlug: 'add-a-guest',
      topicSlug: 'managing-guests',
      context: { secret: 'leak' },
    })
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        context: {
          article_slug: 'add-a-guest',
          category_slug: 'managing-guests',
        },
      })
    )
  })
})
