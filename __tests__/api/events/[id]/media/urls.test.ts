import { describe, it, expect, vi, beforeEach } from 'vitest'

const { createClientMock, getSignedDownloadUrlMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  getSignedDownloadUrlMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({ createClient: createClientMock }))
vi.mock('next/headers', () => ({ cookies: vi.fn().mockResolvedValue({ getAll: () => [], set: vi.fn() }) }))
vi.mock('@/lib/storage/r2', async () => {
  const actual = await vi.importActual<typeof import('@/lib/storage/r2')>('@/lib/storage/r2')
  return { ...actual, getSignedDownloadUrl: getSignedDownloadUrlMock, R2_BUCKET_PRIVATE: 'evenzi-private' }
})

import { POST } from '@/app/api/events/[id]/media/urls/route'

const EVENT_ID = '550e8400-e29b-41d4-a716-446655440000'
const MEDIA_ID_1 = '660e8400-e29b-41d4-a716-446655440001'
const MEDIA_ID_2 = '770e8400-e29b-41d4-a716-446655440002'

function makeOwnerChain() {
  const chain: Record<string, unknown> = {}
  const self = () => chain
  for (const m of ['select', 'eq', 'is']) chain[m] = vi.fn().mockImplementation(self)
  chain.single = vi.fn().mockResolvedValue({ data: { id: EVENT_ID }, error: null })
  return chain
}

function makeDeniedEventsChain() {
  const chain: Record<string, unknown> = {}
  const self = () => chain
  for (const m of ['select', 'eq', 'is']) chain[m] = vi.fn().mockImplementation(self)
  chain.single = vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } })
  return chain
}

function makeDeniedCollabChain() {
  const chain: Record<string, unknown> = {}
  const self = () => chain
  for (const m of ['select', 'eq']) chain[m] = vi.fn().mockImplementation(self)
  chain.single = vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'not found' } })
  return chain
}

function makeMediaListChain(rows: { id: string; storage_key: string }[]) {
  const chain: Record<string, unknown> = { select: vi.fn(), eq: vi.fn(), in: vi.fn() }
  chain.select = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.in = vi.fn().mockResolvedValue({ data: rows, error: null })
  return chain
}

function makeSupabaseMock(rows: { id: string; storage_key: string }[]) {
  const mediaChain = makeMediaListChain(rows)
  const ownerChain = makeOwnerChain()
  const mock = {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'events') return ownerChain
      return mediaChain
    }),
  }
  return { mock, mediaChain }
}

function req(body: unknown) {
  return new Request(`http://localhost/api/events/${EVENT_ID}/media/urls`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const ctx = { params: Promise.resolve({ id: EVENT_ID }) }

describe('POST /api/events/[id]/media/urls (batch)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getSignedDownloadUrlMock.mockResolvedValue('https://r2.example.com/signed-get-url')
  })

  it('returns a map of id to signed URL for each requested id owned by the event', async () => {
    const { mock, mediaChain } = makeSupabaseMock([
      { id: MEDIA_ID_1, storage_key: `events/${EVENT_ID}/media/a.webp` },
      { id: MEDIA_ID_2, storage_key: `events/${EVENT_ID}/media/b.webp` },
    ])
    createClientMock.mockResolvedValue(mock)
    const res = await POST(req({ mediaIds: [MEDIA_ID_1, MEDIA_ID_2] }), ctx)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body[MEDIA_ID_1].url).toBe('https://r2.example.com/signed-get-url')
    expect(body[MEDIA_ID_2].url).toBe('https://r2.example.com/signed-get-url')
    expect(typeof body[MEDIA_ID_1].expiresAt).toBe('number')
    // Guards against a regression that drops the event_id scoping from the media
    // list query — without this .eq() call, this test would still pass on a
    // canned mock row for an event that doesn't actually own the media.
    expect(mediaChain.eq).toHaveBeenCalledWith('event_id', EVENT_ID)
  })

  it('omits ids that do not belong to this event (scoped by the eq(event_id) filter)', async () => {
    const { mock } = makeSupabaseMock([{ id: MEDIA_ID_1, storage_key: `events/${EVENT_ID}/media/a.webp` }])
    createClientMock.mockResolvedValue(mock)
    const res = await POST(req({ mediaIds: [MEDIA_ID_1, MEDIA_ID_2] }), ctx)
    const body = await res.json()
    expect(body[MEDIA_ID_1]).toBeDefined()
    expect(body[MEDIA_ID_2]).toBeUndefined()
  })

  it('returns 400 for more than 200 ids', async () => {
    createClientMock.mockResolvedValue(makeSupabaseMock([]).mock)
    const ids = Array.from({ length: 201 }, () => MEDIA_ID_1)
    const res = await POST(req({ mediaIds: ids }), ctx)
    expect(res.status).toBe(400)
  })

  it('returns 404 when the event is not owned by the caller', async () => {
    const deniedEvents = makeDeniedEventsChain()
    const deniedCollab = makeDeniedCollabChain()
    const mock = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'events') return deniedEvents
        if (table === 'event_collaborators') return deniedCollab
        return makeMediaListChain([])
      }),
    }
    createClientMock.mockResolvedValue(mock)
    const res = await POST(req({ mediaIds: [MEDIA_ID_1] }), ctx)
    expect(res.status).toBe(404)
  })
})
