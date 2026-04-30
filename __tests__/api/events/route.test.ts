import { beforeEach, describe, expect, it, vi } from 'vitest'

// --- Hoisted mocks ---

const { createServerClientMock } = vi.hoisted(() => ({
  createServerClientMock: vi.fn(),
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: createServerClientMock,
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    getAll: () => [],
    set: vi.fn(),
  }),
}))

import { POST, GET } from '@/app/api/events/route'

// --- Shared helpers ---

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000'
const TYPE_UUID  = '660e8400-e29b-41d4-a716-446655440001'

function makeQueryChain(overrides: Record<string, unknown> = {}) {
  const chain: Record<string, unknown> = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  }
  // Apply overrides after defaults so caller-supplied mocks aren't stomped
  Object.assign(chain, overrides)
  // Only set chain-return on methods NOT overridden (so resolved values are preserved)
  const chainable = ['select', 'eq', 'order'] as const
  for (const method of chainable) {
    if (!(method in overrides)) {
      ;(chain[method] as ReturnType<typeof vi.fn>).mockReturnValue(chain)
    }
  }
  return chain
}

function makeSupabaseMock() {
  const queryChain = makeQueryChain()
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
    },
    from: vi.fn().mockReturnValue(queryChain),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  }
}

function setupMock(supabaseMock: ReturnType<typeof makeSupabaseMock>) {
  createServerClientMock.mockImplementation(() => supabaseMock)
}

// --- POST /api/events ---

describe('POST /api/events', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY = 'test-key'
  })

  it('returns 401 when unauthenticated', async () => {
    const supabase = makeSupabaseMock()
    supabase.auth.getUser = vi.fn().mockResolvedValue({ data: { user: null }, error: { message: 'Not authenticated' } })
    setupMock(supabase)

    const request = new Request('http://localhost/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    const response = await POST(request)
    expect(response.status).toBe(401)

    const body = await response.json()
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 400 for invalid payload (missing required fields)', async () => {
    const supabase = makeSupabaseMock()
    setupMock(supabase)

    const request = new Request('http://localhost/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventTypeId: 'not-a-uuid', metadata: {}, subEvents: [] }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)

    const body = await response.json()
    expect(body.error).toBe('Validation failed')
  })

  it('returns 400 for invalid JSON body', async () => {
    const supabase = makeSupabaseMock()
    setupMock(supabase)

    const request = new Request('http://localhost/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('returns 400 when event type does not exist', async () => {
    const supabase = makeSupabaseMock()
    const chain = makeQueryChain({
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
    })
    supabase.from = vi.fn().mockReturnValue(chain)
    setupMock(supabase)

    const request = new Request('http://localhost/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventTypeId: VALID_UUID,
        metadata: { partner_1_name: 'Aarav', partner_2_name: 'Ishani' },
        subEvents: [{ subEventTypeId: TYPE_UUID, customName: null }],
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)

    const body = await response.json()
    expect(body.error).toBe('Event type not found')
  })

  it('returns 400 when event type is disabled', async () => {
    const supabase = makeSupabaseMock()
    const chain = makeQueryChain({
      single: vi.fn().mockResolvedValue({
        data: { id: VALID_UUID, name: 'Wedding', slug: 'wedding', enabled: false },
        error: null,
      }),
    })
    supabase.from = vi.fn().mockReturnValue(chain)
    setupMock(supabase)

    const request = new Request('http://localhost/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventTypeId: VALID_UUID,
        metadata: { partner_1_name: 'Aarav', partner_2_name: 'Ishani' },
        subEvents: [{ subEventTypeId: TYPE_UUID, customName: null }],
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)

    const body = await response.json()
    expect(body.error).toBe('Event type is not available')
  })

  it('returns 201 with event details on success', async () => {
    const supabase = makeSupabaseMock()
    const chain = makeQueryChain({
      single: vi.fn().mockResolvedValue({
        data: { id: VALID_UUID, name: 'Wedding', slug: 'wedding', enabled: true },
        error: null,
      }),
    })
    supabase.from = vi.fn().mockReturnValue(chain)
    supabase.rpc = vi.fn().mockResolvedValue({
      data: {
        event_id: 'event-abc',
        event_name: "Aarav & Ishani's Wedding",
        event_status: 'draft',
        created_at: '2026-04-09T00:00:00Z',
      },
      error: null,
    })
    setupMock(supabase)

    const request = new Request('http://localhost/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventTypeId: VALID_UUID,
        metadata: { partner_1_name: 'Aarav', partner_2_name: 'Ishani' },
        primaryDate: '2026-12-14',
        primaryVenue: 'Udaipur',
        guestCapacity: 350,
        subEvents: [{ subEventTypeId: TYPE_UUID, customName: null }],
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(201)

    const body = await response.json()
    expect(body.event.id).toBe('event-abc')
    expect(body.event.name).toBe("Aarav & Ishani's Wedding")
    expect(body.event.status).toBe('draft')
  })
})

// --- GET /api/events ---

describe('GET /api/events', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY = 'test-key'
  })

  it('returns 401 when unauthenticated', async () => {
    const supabase = makeSupabaseMock()
    supabase.auth.getUser = vi.fn().mockResolvedValue({ data: { user: null }, error: { message: 'Not authenticated' } })
    setupMock(supabase)

    const response = await GET()
    expect(response.status).toBe(401)

    const body = await response.json()
    expect(body.error).toBe('Unauthorized')
  })

  it('returns empty events array when user has no events', async () => {
    const supabase = makeSupabaseMock()
    const chain = makeQueryChain({
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    })
    supabase.from = vi.fn().mockReturnValue(chain)
    setupMock(supabase)

    const response = await GET()
    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body.events).toEqual([])
  })

  it('returns mapped events list', async () => {
    const supabase = makeSupabaseMock()
    const chain = makeQueryChain({
      order: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'event-1',
            name: "Aarav & Ishani's Wedding",
            primary_date: '2026-12-14',
            primary_venue: 'Udaipur',
            guest_capacity: 350,
            cover_image_url: null,
            status: 'draft',
            created_at: '2026-04-09T00:00:00Z',
            event_types: { name: 'Wedding', slug: 'wedding', icon_name: 'rings' },
            event_sub_events: [{ count: 3 }],
          },
        ],
        error: null,
      }),
    })
    supabase.from = vi.fn().mockReturnValue(chain)
    setupMock(supabase)

    const response = await GET()
    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body.events).toHaveLength(1)

    const event = body.events[0]
    expect(event.id).toBe('event-1')
    expect(event.name).toBe("Aarav & Ishani's Wedding")
    expect(event.eventType.slug).toBe('wedding')
    expect(event.subEventCount).toBe(3)
    expect(event.primaryDate).toBe('2026-12-14')
  })
})
