import { describe, it, expect, vi, beforeEach } from 'vitest'

const rpc = vi.fn()
const getUser = vi.fn()
const insert = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser },
    schema: () => ({ rpc }),
  }),
}))
vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({
    from: () => ({
      insert: (...args: unknown[]) => {
        insert(...args)
        return {
          select: () => ({
            single: async () => ({ data: { ref: 'ref-uuid' } }),
          }),
        }
      },
    }),
  }),
}))

async function post(body: unknown) {
  const { POST } = await import('@/app/api/help/search/route')
  return POST(
    new Request('http://localhost/api/help/search', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  )
}

beforeEach(() => {
  rpc.mockReset()
  getUser.mockReset()
  insert.mockReset()
  rpc.mockResolvedValue({ data: [], error: null })
})

describe('POST /api/help/search', () => {
  it('searches the public corpus when logged out', async () => {
    getUser.mockResolvedValue({ data: { user: null } })
    await post({ q: 'what does evenzi cost' })
    expect(rpc).toHaveBeenCalledWith(
      'search_faq',
      expect.objectContaining({ p_audience: 'public' })
    )
  })

  it('searches the app corpus when signed in', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    await post({ q: 'how do I add a guest' })
    expect(rpc).toHaveBeenCalledWith(
      'search_faq',
      expect.objectContaining({ p_audience: 'app' })
    )
  })

  it('never accepts audience or user_id from the request body', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'real-user' } } })
    await post({ q: 'a valid query', audience: 'public', user_id: 'attacker' })
    expect(rpc).toHaveBeenCalledWith(
      'search_faq',
      expect.objectContaining({ p_audience: 'app' })
    )
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'real-user' })
    )
  })

  it('rejects a query under 3 characters', async () => {
    getUser.mockResolvedValue({ data: { user: null } })
    const res = await post({ q: 'ab' })
    expect(res.status).toBe(400)
  })

  it('returns 400 on malformed JSON', async () => {
    const { POST } = await import('@/app/api/help/search/route')
    const res = await POST(
      new Request('http://localhost/api/help/search', {
        method: 'POST',
        body: 'not json',
      })
    )
    expect(res.status).toBe(400)
  })
})
