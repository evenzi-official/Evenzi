import { describe, it, expect, vi, beforeEach } from 'vitest'

const { createClientMock, deleteObjectMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  deleteObjectMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({ createClient: createClientMock }))
vi.mock('next/headers', () => ({ cookies: vi.fn().mockResolvedValue({ getAll: () => [], set: vi.fn() }) }))
vi.mock('@/lib/storage/r2', async () => {
  const actual = await vi.importActual<typeof import('@/lib/storage/r2')>('@/lib/storage/r2')
  return { ...actual, deleteObject: deleteObjectMock, R2_BUCKET_PRIVATE: 'evenzi-private' }
})

import { DELETE } from '@/app/api/events/[id]/media/[mediaId]/route'

const EVENT_ID = '550e8400-e29b-41d4-a716-446655440000'
const MEDIA_ID = '660e8400-e29b-41d4-a716-446655440001'

function makeOwnerChain() {
  const chain: Record<string, unknown> = {}
  const self = () => chain
  for (const m of ['select', 'eq', 'is']) chain[m] = vi.fn().mockImplementation(self)
  chain.single = vi.fn().mockResolvedValue({ data: { id: EVENT_ID }, error: null })
  return chain
}

function makeMediaDeleteChain(row: unknown) {
  const findChain: Record<string, unknown> = { select: vi.fn(), eq: vi.fn() }
  findChain.select = vi.fn().mockReturnValue(findChain)
  findChain.eq = vi.fn().mockReturnValue(findChain)
  findChain.single = vi.fn().mockResolvedValue({ data: row, error: row ? null : { message: 'not found' } })

  const delChain: Record<string, unknown> = { delete: vi.fn(), eq: vi.fn() }
  delChain.delete = vi.fn().mockReturnValue(delChain)
  delChain.eq = vi.fn().mockResolvedValue({ error: null })

  return { findChain, delChain }
}

function makeSupabaseMock(row: unknown) {
  const { findChain, delChain } = makeMediaDeleteChain(row)
  const ownerChain = makeOwnerChain()
  let callCount = 0
  const mock = {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'events') return ownerChain
      callCount++
      return callCount === 1 ? findChain : delChain
    }),
  }
  return { mock, findChain }
}

const ctx = { params: Promise.resolve({ id: EVENT_ID, mediaId: MEDIA_ID }) }
const req = new Request(`http://localhost/api/events/${EVENT_ID}/media/${MEDIA_ID}`, { method: 'DELETE' })

describe('DELETE /api/events/[id]/media/[mediaId]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    deleteObjectMock.mockResolvedValue(undefined)
  })

  it('returns 404 when the media row does not exist', async () => {
    const { mock } = makeSupabaseMock(null)
    createClientMock.mockResolvedValue(mock)
    const res = await DELETE(req, ctx)
    expect(res.status).toBe(404)
  })

  it('deletes the row then purges both R2 keys, returns 204', async () => {
    const row = { id: MEDIA_ID, storage_key: 'events/x/media/a.webp', thumbnail_key: 'events/x/media/a_thumb.webp' }
    const { mock, findChain } = makeSupabaseMock(row)
    createClientMock.mockResolvedValue(mock)
    const res = await DELETE(req, ctx)
    expect(res.status).toBe(204)
    expect(deleteObjectMock).toHaveBeenCalledWith(expect.anything(), row.storage_key)
    expect(deleteObjectMock).toHaveBeenCalledWith(expect.anything(), row.thumbnail_key)
    // Guards against a regression that drops the event_id scoping from the find query —
    // without both .eq() calls, this test would still pass on a canned mock row.
    expect(findChain.eq).toHaveBeenCalledWith('event_id', EVENT_ID)
    expect(findChain.eq).toHaveBeenCalledWith('id', MEDIA_ID)
  })
})
