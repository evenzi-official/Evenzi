import { describe, it, expect, vi, beforeEach } from 'vitest'

const { createServerClientMock, headObjectMock, getObjectRangeMock, deleteObjectMock } = vi.hoisted(() => ({
  createServerClientMock: vi.fn(),
  headObjectMock: vi.fn(),
  getObjectRangeMock: vi.fn(),
  deleteObjectMock: vi.fn(),
}))

vi.mock('@supabase/ssr', () => ({ createServerClient: createServerClientMock }))
vi.mock('next/headers', () => ({ cookies: vi.fn().mockResolvedValue({ getAll: () => [], set: vi.fn() }) }))
vi.mock('@/lib/storage/r2', async () => {
  const actual = await vi.importActual<typeof import('@/lib/storage/r2')>('@/lib/storage/r2')
  return {
    ...actual,
    headObject: headObjectMock,
    getObjectRange: getObjectRangeMock,
    deleteObject: deleteObjectMock,
    R2_BUCKET_PRIVATE: 'evenzi-private',
  }
})

import { POST } from '@/app/api/events/[id]/media/route'

const EVENT_ID = '550e8400-e29b-41d4-a716-446655440000'
const MASTER_KEY = `events/${EVENT_ID}/media/abc.webp`
const THUMB_KEY = `events/${EVENT_ID}/media/abc_thumb.webp`

const WEBP_MAGIC = Buffer.concat([Buffer.from('RIFF'), Buffer.from([0, 0, 0, 0]), Buffer.from('WEBP')])

function makeOwnerChain() {
  const chain: Record<string, unknown> = { select: vi.fn(), eq: vi.fn(), is: vi.fn() }
  chain.select = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.is = vi.fn().mockReturnValue(chain)
  chain.single = vi.fn().mockResolvedValue({ data: { id: EVENT_ID }, error: null })
  return chain
}

function makeMediaChain(existingRow: unknown, insertedRow: unknown) {
  const selectChain: Record<string, unknown> = { select: vi.fn(), eq: vi.fn() }
  selectChain.select = vi.fn().mockReturnValue(selectChain)
  selectChain.eq = vi.fn().mockReturnValue(selectChain)
  selectChain.single = vi.fn().mockResolvedValue({ data: existingRow, error: existingRow ? null : { message: 'not found' } })

  const insertChain: Record<string, unknown> = { insert: vi.fn(), select: vi.fn() }
  insertChain.insert = vi.fn().mockReturnValue(insertChain)
  insertChain.select = vi.fn().mockReturnValue(insertChain)
  insertChain.single = vi.fn().mockResolvedValue({ data: insertedRow, error: insertedRow ? null : { message: 'insert failed' } })

  return { selectChain, insertChain }
}

function makeSupabaseMock(opts: { existingRow?: unknown; insertedRow?: unknown } = {}) {
  const { selectChain, insertChain } = makeMediaChain(opts.existingRow ?? null, opts.insertedRow ?? { id: 'media-1' })
  let callCount = 0
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'events') return makeOwnerChain()
      callCount++
      return callCount === 1 ? selectChain : insertChain
    }),
  }
}

function req(body: unknown) {
  return new Request(`http://localhost/api/events/${EVENT_ID}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const ctx = { params: Promise.resolve({ id: EVENT_ID }) }
const validBody = {
  kind: 'photo',
  masterKey: MASTER_KEY,
  thumbKey: THUMB_KEY,
  contentType: 'image/webp',
  width: 1200,
  height: 800,
}

describe('POST /api/events/[id]/media (commit)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    headObjectMock.mockImplementation(async ({ key }: { key: string }) => {
      if (key === MASTER_KEY) return { contentLength: 5 * 1024 * 1024, contentType: 'image/webp' }
      if (key === THUMB_KEY) return { contentLength: 100 * 1024, contentType: 'image/webp' }
      return null
    })
    getObjectRangeMock.mockResolvedValue(WEBP_MAGIC)
    deleteObjectMock.mockResolvedValue(undefined)
  })

  it('inserts the row and returns 200 when both keys are valid', async () => {
    createServerClientMock.mockReturnValue(makeSupabaseMock())
    const res = await POST(req(validBody), ctx)
    expect(res.status).toBe(200)
  })

  it('rejects with 400 and deletes both keys when the master is missing (thumb-only asymmetric failure — reverse case)', async () => {
    createServerClientMock.mockReturnValue(makeSupabaseMock())
    headObjectMock.mockImplementation(async ({ key }: { key: string }) => (key === THUMB_KEY ? { contentLength: 100 * 1024, contentType: 'image/webp' } : null))
    const res = await POST(req(validBody), ctx)
    expect(res.status).toBe(400)
    expect(deleteObjectMock).toHaveBeenCalledWith(expect.anything(), MASTER_KEY)
    expect(deleteObjectMock).toHaveBeenCalledWith(expect.anything(), THUMB_KEY)
  })

  it('rejects with 400 and deletes both keys when the thumb is missing (master-only asymmetric failure)', async () => {
    createServerClientMock.mockReturnValue(makeSupabaseMock())
    headObjectMock.mockImplementation(async ({ key }: { key: string }) => (key === MASTER_KEY ? { contentLength: 5 * 1024 * 1024, contentType: 'image/webp' } : null))
    const res = await POST(req(validBody), ctx)
    expect(res.status).toBe(400)
    expect(deleteObjectMock).toHaveBeenCalledWith(expect.anything(), MASTER_KEY)
    expect(deleteObjectMock).toHaveBeenCalledWith(expect.anything(), THUMB_KEY)
  })

  it('rejects with 413 when the master exceeds the 20MB photo cap', async () => {
    createServerClientMock.mockReturnValue(makeSupabaseMock())
    headObjectMock.mockImplementation(async ({ key }: { key: string }) => {
      if (key === MASTER_KEY) return { contentLength: 21 * 1024 * 1024, contentType: 'image/webp' }
      if (key === THUMB_KEY) return { contentLength: 100 * 1024, contentType: 'image/webp' }
      return null
    })
    const res = await POST(req(validBody), ctx)
    expect(res.status).toBe(413)
    expect(deleteObjectMock).toHaveBeenCalledTimes(2)
  })

  it('rejects with 413 when the thumb exceeds the 2MB cap', async () => {
    createServerClientMock.mockReturnValue(makeSupabaseMock())
    headObjectMock.mockImplementation(async ({ key }: { key: string }) => {
      if (key === MASTER_KEY) return { contentLength: 5 * 1024 * 1024, contentType: 'image/webp' }
      if (key === THUMB_KEY) return { contentLength: 3 * 1024 * 1024, contentType: 'image/webp' }
      return null
    })
    const res = await POST(req(validBody), ctx)
    expect(res.status).toBe(413)
    expect(deleteObjectMock).toHaveBeenCalledTimes(2)
  })

  it('rejects with 403 when masterKey does not belong to this event', async () => {
    createServerClientMock.mockReturnValue(makeSupabaseMock())
    const res = await POST(
      req({ ...validBody, masterKey: 'events/00000000-0000-0000-0000-000000000099/media/other.webp' }),
      ctx
    )
    expect(res.status).toBe(403)
    expect(deleteObjectMock).not.toHaveBeenCalled()
  })

  it('rejects with 403 when thumbKey does not belong to this event', async () => {
    createServerClientMock.mockReturnValue(makeSupabaseMock())
    const res = await POST(
      req({ ...validBody, thumbKey: 'events/00000000-0000-0000-0000-000000000099/media/other_thumb.webp' }),
      ctx
    )
    expect(res.status).toBe(403)
    expect(deleteObjectMock).not.toHaveBeenCalled()
  })

  it('rejects with 400 when the magic bytes do not match the declared content type', async () => {
    createServerClientMock.mockReturnValue(makeSupabaseMock())
    getObjectRangeMock.mockResolvedValue(Buffer.from('not-a-real-webp-header'))
    const res = await POST(req(validBody), ctx)
    expect(res.status).toBe(400)
    expect(deleteObjectMock).toHaveBeenCalledTimes(2)
  })

  it('is idempotent — returns the existing row instead of inserting a duplicate for the same storage_key', async () => {
    const existing = { id: 'media-existing', storage_key: MASTER_KEY }
    createServerClientMock.mockReturnValue(makeSupabaseMock({ existingRow: existing }))
    const res = await POST(req(validBody), ctx)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe('media-existing')
  })

  it('returns 404 when the event is not owned by the caller', async () => {
    const mock = makeSupabaseMock()
    mock.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'events') {
        const chain: Record<string, unknown> = { select: vi.fn(), eq: vi.fn(), is: vi.fn() }
        chain.select = vi.fn().mockReturnValue(chain)
        chain.eq = vi.fn().mockReturnValue(chain)
        chain.is = vi.fn().mockReturnValue(chain)
        chain.single = vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } })
        return chain
      }
      return makeMediaChain(null, { id: 'media-1' }).selectChain
    })
    createServerClientMock.mockReturnValue(mock)
    const res = await POST(req(validBody), ctx)
    expect(res.status).toBe(404)
  })
})
