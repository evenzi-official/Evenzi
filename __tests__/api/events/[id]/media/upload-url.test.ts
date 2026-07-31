import { describe, it, expect, vi, beforeEach } from 'vitest'

const { createServerClientMock, getSignedUploadUrlMock } = vi.hoisted(() => ({
  createServerClientMock: vi.fn(),
  getSignedUploadUrlMock: vi.fn(),
}))

vi.mock('@supabase/ssr', () => ({ createServerClient: createServerClientMock }))
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ getAll: () => [], set: vi.fn() }),
}))
vi.mock('@/lib/storage/r2', async () => {
  const actual = await vi.importActual<typeof import('@/lib/storage/r2')>('@/lib/storage/r2')
  return { ...actual, getSignedUploadUrl: getSignedUploadUrlMock, R2_BUCKET_PRIVATE: 'evenzi-private' }
})

import { POST } from '@/app/api/events/[id]/media/upload-url/route'

const EVENT_ID = '550e8400-e29b-41d4-a716-446655440000'

function makeOwnerChain(owned: boolean) {
  const chain: Record<string, unknown> = { select: vi.fn(), eq: vi.fn(), is: vi.fn() }
  chain.select = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.is = vi.fn().mockReturnValue(chain)
  chain.single = vi.fn().mockResolvedValue(owned ? { data: { id: EVENT_ID }, error: null } : { data: null, error: { message: 'not found' } })
  return chain
}

function makeSupabaseMock(opts: { authed?: boolean; owned?: boolean } = {}) {
  const { authed = true, owned = true } = opts
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue(
        authed ? { data: { user: { id: 'user-1' } }, error: null } : { data: { user: null }, error: { message: 'no session' } }
      ),
    },
    from: vi.fn().mockReturnValue(makeOwnerChain(owned)),
  }
}

function req(body: unknown) {
  return new Request(`http://localhost/api/events/${EVENT_ID}/media/upload-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const ctx = { params: Promise.resolve({ id: EVENT_ID }) }

describe('POST /api/events/[id]/media/upload-url', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getSignedUploadUrlMock.mockResolvedValue('https://r2.example.com/signed-put-url')
  })

  it('returns 401 when unauthenticated', async () => {
    createServerClientMock.mockReturnValue(makeSupabaseMock({ authed: false }))
    const res = await POST(req({ kind: 'photo', part: 'master', contentType: 'image/webp' }), ctx)
    expect(res.status).toBe(401)
  })

  it('returns 404 when the event is not owned by the caller', async () => {
    createServerClientMock.mockReturnValue(makeSupabaseMock({ owned: false }))
    const res = await POST(req({ kind: 'photo', part: 'master', contentType: 'image/webp' }), ctx)
    expect(res.status).toBe(404)
  })

  it('returns 400 for a disallowed content type', async () => {
    createServerClientMock.mockReturnValue(makeSupabaseMock())
    const res = await POST(req({ kind: 'photo', part: 'master', contentType: 'application/pdf' }), ctx)
    expect(res.status).toBe(400)
  })

  it('returns a presigned URL and a server-generated key for a valid request', async () => {
    createServerClientMock.mockReturnValue(makeSupabaseMock())
    const res = await POST(req({ kind: 'photo', part: 'master', contentType: 'image/webp' }), ctx)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.url).toBe('https://r2.example.com/signed-put-url')
    expect(body.key).toMatch(new RegExp(`^events/${EVENT_ID}/media/`))
    expect(getSignedUploadUrlMock).toHaveBeenCalledWith(
      expect.objectContaining({ contentType: 'image/webp', expiresIn: 300 })
    )
  })

  it('uses a 1800s expiry for video master parts', async () => {
    createServerClientMock.mockReturnValue(makeSupabaseMock())
    await POST(req({ kind: 'video', part: 'master', contentType: 'video/mp4' }), ctx)
    expect(getSignedUploadUrlMock).toHaveBeenCalledWith(expect.objectContaining({ expiresIn: 1800 }))
  })

  it('returns a thumb key distinct from the master key naming', async () => {
    createServerClientMock.mockReturnValue(makeSupabaseMock())
    const res = await POST(req({ kind: 'photo', part: 'thumb', contentType: 'image/webp' }), ctx)
    const body = await res.json()
    expect(body.key).toContain('_thumb')
  })
})
