import { describe, it, expect, vi, beforeEach } from 'vitest'

const { createServerClientMock, getSignedDownloadUrlMock } = vi.hoisted(() => ({
  createServerClientMock: vi.fn(),
  getSignedDownloadUrlMock: vi.fn(),
}))

vi.mock('@supabase/ssr', () => ({ createServerClient: createServerClientMock }))
vi.mock('next/headers', () => ({ cookies: vi.fn().mockResolvedValue({ getAll: () => [], set: vi.fn() }) }))
vi.mock('@/lib/storage/r2', async () => {
  const actual = await vi.importActual<typeof import('@/lib/storage/r2')>('@/lib/storage/r2')
  return { ...actual, getSignedDownloadUrl: getSignedDownloadUrlMock, R2_BUCKET_PRIVATE: 'evenzi-private' }
})

import { GET } from '@/app/api/events/[id]/media/[mediaId]/url/route'

const EVENT_ID = '550e8400-e29b-41d4-a716-446655440000'
const MEDIA_ID = '660e8400-e29b-41d4-a716-446655440001'

function makeOwnerChain() {
  const chain: Record<string, unknown> = { select: vi.fn(), eq: vi.fn(), is: vi.fn() }
  chain.select = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.is = vi.fn().mockReturnValue(chain)
  chain.single = vi.fn().mockResolvedValue({ data: { id: EVENT_ID }, error: null })
  return chain
}

function makeMediaFindChain(row: { storage_key: string; thumbnail_key: string | null } | null) {
  const chain: Record<string, unknown> = { select: vi.fn(), eq: vi.fn() }
  chain.select = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.single = vi.fn().mockResolvedValue({ data: row, error: row ? null : { message: 'not found' } })
  return chain
}

function makeSupabaseMock(row: { storage_key: string; thumbnail_key: string | null } | null) {
  const mediaChain = makeMediaFindChain(row)
  const mock = {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
    from: vi.fn().mockImplementation((table: string) => (table === 'events' ? makeOwnerChain() : mediaChain)),
  }
  return { mock, mediaChain }
}

const ctx = { params: Promise.resolve({ id: EVENT_ID, mediaId: MEDIA_ID }) }
const req = new Request(`http://localhost/api/events/${EVENT_ID}/media/${MEDIA_ID}/url`)

describe('GET /api/events/[id]/media/[mediaId]/url', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getSignedDownloadUrlMock.mockResolvedValue('https://r2.example.com/signed-get-url')
  })

  it('returns a signed URL and thumbUrl for the requested media id', async () => {
    const { mock, mediaChain } = makeSupabaseMock({
      storage_key: `events/${EVENT_ID}/media/a.webp`,
      thumbnail_key: `events/${EVENT_ID}/media/a_thumb.webp`,
    })
    createServerClientMock.mockReturnValue(mock)
    const res = await GET(req, ctx)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.url).toBe('https://r2.example.com/signed-get-url')
    expect(body.thumbUrl).toBe('https://r2.example.com/signed-get-url')
    expect(typeof body.expiresAt).toBe('number')
    // Guards against a regression that drops the event_id scoping from the find
    // query — without both .eq() calls, this test would still pass on a canned
    // mock row for an event that doesn't actually own the media.
    expect(mediaChain.eq).toHaveBeenCalledWith('event_id', EVENT_ID)
    expect(mediaChain.eq).toHaveBeenCalledWith('id', MEDIA_ID)
  })

  it('omits thumbUrl when the row has no thumbnail_key', async () => {
    const { mock } = makeSupabaseMock({ storage_key: `events/${EVENT_ID}/media/a.webp`, thumbnail_key: null })
    createServerClientMock.mockReturnValue(mock)
    const res = await GET(req, ctx)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.url).toBe('https://r2.example.com/signed-get-url')
    expect(body.thumbUrl).toBeUndefined()
  })

  it('returns 404 when the media row does not exist', async () => {
    const { mock } = makeSupabaseMock(null)
    createServerClientMock.mockReturnValue(mock)
    const res = await GET(req, ctx)
    expect(res.status).toBe(404)
  })

  it('returns 404 when the event is not owned by the caller', async () => {
    const mock = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'events') {
          const chain: Record<string, unknown> = { select: vi.fn(), eq: vi.fn(), is: vi.fn() }
          chain.select = vi.fn().mockReturnValue(chain)
          chain.eq = vi.fn().mockReturnValue(chain)
          chain.is = vi.fn().mockReturnValue(chain)
          chain.single = vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } })
          return chain
        }
        return makeMediaFindChain(null)
      }),
    }
    createServerClientMock.mockReturnValue(mock)
    const res = await GET(req, ctx)
    expect(res.status).toBe(404)
  })
})
