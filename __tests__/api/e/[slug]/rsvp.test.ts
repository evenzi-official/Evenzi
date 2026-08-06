import { describe, it, expect, vi, beforeEach } from 'vitest'

process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost'
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY = 'test-key'

const { createServerClientMock } = vi.hoisted(() => ({ createServerClientMock: vi.fn() }))
vi.mock('@supabase/ssr', () => ({ createServerClient: createServerClientMock }))
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    get: () => ({ value: 'session-token-abc' }),
    getAll: () => [],
    set: vi.fn(),
  }),
}))

import { POST } from '@/app/api/e/[slug]/rsvp/route'

const SLUG = 'anya-kabir-20270131'

function makeSupabaseMock(rpcError?: { message: string }) {
  return {
    rpc: vi.fn().mockResolvedValue({ error: rpcError ?? null }),
  }
}

function makeRequest(body: Record<string, unknown>) {
  return new Request(`http://localhost/api/e/${SLUG}/rsvp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const ctx = { params: Promise.resolve({ slug: SLUG }) }

describe('POST /api/e/[slug]/rsvp — guest-settings enforcement (inside submit_rsvp)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('maps plus_ones_not_allowed from the RPC to a 400', async () => {
    createServerClientMock.mockReturnValue(makeSupabaseMock({ message: 'plus_ones_not_allowed' }))
    const res = await POST(makeRequest({
      sub_event_id: '550e8400-e29b-41d4-a716-446655440000',
      response_status: 'confirmed',
      plus_one_count: 1,
    }), ctx)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Plus-ones are not enabled for this event')
  })

  it('maps dietary_not_collected from the RPC to a 400', async () => {
    createServerClientMock.mockReturnValue(makeSupabaseMock({ message: 'dietary_not_collected' }))
    const res = await POST(makeRequest({
      sub_event_id: '550e8400-e29b-41d4-a716-446655440000',
      response_status: 'confirmed',
      dietary_notes: 'vegetarian',
    }), ctx)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Dietary notes are not collected for this event')
  })

  it('succeeds when the RPC raises no error', async () => {
    createServerClientMock.mockReturnValue(makeSupabaseMock())
    const res = await POST(makeRequest({
      sub_event_id: '550e8400-e29b-41d4-a716-446655440000',
      response_status: 'confirmed',
      plus_one_count: 2,
      dietary_notes: 'vegan',
    }), ctx)
    expect(res.status).toBe(200)
  })
})
