import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock,
}))

import { GET as getEventTypes } from '@/app/api/event-types/route'
import { GET as getSubEvents } from '@/app/api/event-types/[typeId]/sub-events/route'

const TYPE_ID = '550e8400-e29b-41d4-a716-446655440000'
const TYPE_ID_2 = '550e8400-e29b-41d4-a716-446655440001'
const SUB_ID_1 = '6ba7b810-9dad-41d1-80b4-00c04fd430c8'
const SUB_ID_2 = '6ba7b811-9dad-41d1-80b4-00c04fd430c8'

const mockEventTypeRows = [
  {
    id: TYPE_ID,
    name: 'Wedding',
    slug: 'wedding',
    description: 'Traditional wedding ceremony',
    icon_name: 'rings',
    image_url: null,
    enabled: true,
    has_sub_events: true,
    form_schema: [],
    features: ['invitations', 'rsvp'],
    display_order: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: TYPE_ID_2,
    name: 'Birthday',
    slug: 'birthday',
    description: null,
    icon_name: 'cake',
    image_url: null,
    enabled: true,
    has_sub_events: false,
    form_schema: [],
    features: [],
    display_order: 2,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
]

const mockSubEventTypeRows = [
  {
    id: SUB_ID_1,
    event_type_id: TYPE_ID,
    name: 'Mehendi',
    slug: 'mehendi',
    icon_name: 'flower',
    display_order: 1,
    is_default: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: SUB_ID_2,
    event_type_id: TYPE_ID,
    name: 'Reception',
    slug: 'reception',
    icon_name: null,
    display_order: 2,
    is_default: false,
    created_at: '2024-01-01T00:00:00Z',
  },
]

/** Match route: .schema('config').from(...).select().eq(...).order(...) */
function mockConfigQuery(terminal: { data: unknown; error: unknown }) {
  const order = vi.fn().mockResolvedValue(terminal)
  const chain: { eq: ReturnType<typeof vi.fn>; order: ReturnType<typeof vi.fn> } = {
    eq: vi.fn(),
    order,
  }
  chain.eq.mockReturnValue(chain)
  const select = vi.fn().mockReturnValue(chain)
  const from = vi.fn().mockReturnValue({ select })
  const schema = vi.fn().mockReturnValue({ from })
  return { schema, from, select, eq: chain.eq, order }
}

describe('GET /api/event-types', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns enabled event types sorted by display_order', async () => {
    createClientMock.mockResolvedValue(mockConfigQuery({ data: mockEventTypeRows, error: null }))

    const response = await getEventTypes()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.eventTypes).toHaveLength(2)
    expect(body.eventTypes[0]).toMatchObject({
      id: TYPE_ID,
      name: 'Wedding',
      slug: 'wedding',
      iconName: 'rings',
      imageUrl: null,
      enabled: true,
      hasSubEvents: true,
      displayOrder: 1,
    })
    expect(body.eventTypes[1]).toMatchObject({
      name: 'Birthday',
      enabled: true,
      displayOrder: 2,
    })
  })

  it('returns 500 when the database query fails', async () => {
    createClientMock.mockResolvedValue(mockConfigQuery({ data: null, error: { message: 'DB error' } }))

    const response = await getEventTypes()
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error).toBe('Failed to fetch event types')
  })
})

describe('GET /api/event-types/[typeId]/sub-events', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns sub-event types for a valid UUID', async () => {
    createClientMock.mockResolvedValue(mockConfigQuery({ data: mockSubEventTypeRows, error: null }))

    const response = await getSubEvents(new Request('http://localhost'), {
      params: Promise.resolve({ typeId: TYPE_ID }),
    })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.subEventTypes).toHaveLength(2)
    expect(body.subEventTypes[0]).toMatchObject({
      id: SUB_ID_1,
      name: 'Mehendi',
      slug: 'mehendi',
      iconName: 'flower',
      displayOrder: 1,
      isDefault: true,
    })
    expect(body.subEventTypes[1]).toMatchObject({
      name: 'Reception',
      iconName: null,
      isDefault: false,
    })
  })

  it('returns 400 for an invalid (non-UUID) typeId', async () => {
    const response = await getSubEvents(new Request('http://localhost'), {
      params: Promise.resolve({ typeId: 'not-a-uuid' }),
    })
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toContain('Invalid event type ID')
    expect(createClientMock).not.toHaveBeenCalled()
  })

  it('returns 400 for an empty typeId', async () => {
    const response = await getSubEvents(new Request('http://localhost'), {
      params: Promise.resolve({ typeId: '' }),
    })

    expect(response.status).toBe(400)
    expect(createClientMock).not.toHaveBeenCalled()
  })

  it('returns 500 when the database query fails', async () => {
    createClientMock.mockResolvedValue(mockConfigQuery({ data: null, error: { message: 'DB error' } }))

    const response = await getSubEvents(new Request('http://localhost'), {
      params: Promise.resolve({ typeId: TYPE_ID }),
    })
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error).toBe('Failed to fetch sub-event types')
  })
})
