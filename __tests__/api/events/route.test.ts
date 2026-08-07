import { beforeEach, describe, expect, it, vi } from 'vitest'

// --- Hoisted mocks ---

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock,
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
    in: vi.fn(),
    is: vi.fn(),
    order: vi.fn(),
    update: vi.fn(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  }
  // Apply overrides after defaults so caller-supplied mocks aren't stomped
  Object.assign(chain, overrides)
  // Only set chain-return on methods NOT overridden (so resolved values are preserved)
  const chainable = ['select', 'eq', 'in', 'is', 'order', 'update'] as const
  for (const method of chainable) {
    if (!(method in overrides)) {
      ;(chain[method] as ReturnType<typeof vi.fn>).mockReturnValue(chain)
    }
  }
  return chain
}

function makeSupabaseMock() {
  const queryChain = makeQueryChain()
  const schemaFrom = vi.fn().mockReturnValue(queryChain)
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
    },
    from: vi.fn().mockReturnValue(queryChain),
    schema: vi.fn().mockReturnValue({ from: schemaFrom }),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    _schemaFrom: schemaFrom,
  }
}

function setupMock(supabaseMock: ReturnType<typeof makeSupabaseMock>) {
  createClientMock.mockResolvedValue(supabaseMock)
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
    supabase.schema = vi.fn().mockReturnValue({ from: vi.fn().mockReturnValue(chain) })
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
    supabase.schema = vi.fn().mockReturnValue({ from: vi.fn().mockReturnValue(chain) })
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
    const typeChain = makeQueryChain({
      single: vi.fn().mockResolvedValue({
        data: { id: VALID_UUID, name: 'Wedding', slug: 'wedding', enabled: true },
        error: null,
      }),
    })
    const subTypeChain = makeQueryChain({
      in: vi.fn().mockResolvedValue({
        data: [{ id: TYPE_UUID, display_order: 1 }],
        error: null,
      }),
    })
    supabase.schema = vi.fn().mockReturnValue({
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'event_types') return typeChain
        if (table === 'event_sub_types') return subTypeChain
        return makeQueryChain()
      }),
    })
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
    // .is().order() — is must return chain so order is reachable
    chain.is = vi.fn().mockReturnValue(chain)
    supabase.from = vi.fn().mockReturnValue(chain)
    setupMock(supabase)

    const response = await GET()
    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body.events).toEqual([])
  })

  it('returns mapped events list', async () => {
    const supabase = makeSupabaseMock()
    const eventsChain = makeQueryChain({
      order: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'event-1',
            name: "Aarav & Ishani's Wedding",
            event_type_id: VALID_UUID,
            primary_date: '2026-12-14',
            primary_venue: 'Udaipur',
            guest_capacity: 350,
            cover_image_url: null,
            status: 'draft',
            created_at: '2026-04-09T00:00:00Z',
            event_sub_events: [{ count: 3 }],
          },
        ],
        error: null,
      }),
    })
    eventsChain.is = vi.fn().mockReturnValue(eventsChain)

    const typesChain = makeQueryChain({
      in: vi.fn().mockResolvedValue({
        data: [
          { id: VALID_UUID, name: 'Wedding', slug: 'wedding', icon_name: 'rings' },
        ],
        error: null,
      }),
    })

    supabase.from = vi.fn().mockReturnValue(eventsChain)
    supabase.schema = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue(typesChain),
    })
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
