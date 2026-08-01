import { describe, it, expect, vi, beforeEach } from 'vitest'

const { createServerClientMock, deleteObjectMock } = vi.hoisted(() => ({
  createServerClientMock: vi.fn(),
  deleteObjectMock: vi.fn(),
}))

vi.mock('@supabase/ssr', () => ({ createServerClient: createServerClientMock }))
vi.mock('next/headers', () => ({ cookies: vi.fn().mockResolvedValue({ getAll: () => [], set: vi.fn() }) }))
vi.mock('@/lib/storage/r2', async () => {
  const actual = await vi.importActual<typeof import('@/lib/storage/r2')>('@/lib/storage/r2')
  return { ...actual, deleteObject: deleteObjectMock, R2_BUCKET_PRIVATE: 'evenzi-private' }
})

import { POST } from '@/app/api/events/[id]/media/bulk-delete/route'

const EVENT_ID = '550e8400-e29b-41d4-a716-446655440000'
const ID_A = '660e8400-e29b-41d4-a716-446655440001'
const ID_B = '770e8400-e29b-41d4-a716-446655440002'
const ID_OTHER_EVENT = '880e8400-e29b-41d4-a716-446655440003'

function makeOwnerChain() {
  const chain: Record<string, unknown> = { select: vi.fn(), eq: vi.fn(), is: vi.fn() }
  chain.select = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.is = vi.fn().mockReturnValue(chain)
  chain.single = vi.fn().mockResolvedValue({ data: { id: EVENT_ID }, error: null })
  return chain
}

function makeMediaChain(rows: { id: string; storage_key: string; thumbnail_key: string }[]) {
  const selectChain: Record<string, unknown> = { select: vi.fn(), eq: vi.fn(), in: vi.fn() }
  selectChain.select = vi.fn().mockReturnValue(selectChain)
  selectChain.eq = vi.fn().mockReturnValue(selectChain)
  selectChain.in = vi.fn().mockResolvedValue({ data: rows, error: null })

  const delChain: Record<string, unknown> = { delete: vi.fn(), in: vi.fn() }
  delChain.delete = vi.fn().mockReturnValue(delChain)
  delChain.in = vi.fn().mockResolvedValue({ error: null })

  return { selectChain, delChain }
}

function makeSupabaseMock(rows: { id: string; storage_key: string; thumbnail_key: string }[]) {
  const { selectChain, delChain } = makeMediaChain(rows)
  let callCount = 0
  const mock = {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'events') return makeOwnerChain()
      callCount++
      return callCount === 1 ? selectChain : delChain
    }),
  }
  return { mock, selectChain }
}

function req(body: unknown) {
  return new Request(`http://localhost/api/events/${EVENT_ID}/media/bulk-delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const ctx = { params: Promise.resolve({ id: EVENT_ID }) }

describe('POST /api/events/[id]/media/bulk-delete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    deleteObjectMock.mockResolvedValue(undefined)
  })

  it('deletes rows scoped to the event and returns them as deleted', async () => {
    const rows = [
      { id: ID_A, storage_key: 'k-a', thumbnail_key: 'k-a-thumb' },
      { id: ID_B, storage_key: 'k-b', thumbnail_key: 'k-b-thumb' },
    ]
    const { mock, selectChain } = makeSupabaseMock(rows)
    createServerClientMock.mockReturnValue(mock)
    const res = await POST(req({ ids: [ID_A, ID_B, ID_OTHER_EVENT] }), ctx)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.deleted.sort()).toEqual([ID_A, ID_B].sort())
    // ID_OTHER_EVENT never resolved to a row scoped to this event, so it's reported failed, not silently dropped
    expect(body.failed.map((f: { id: string }) => f.id)).toContain(ID_OTHER_EVENT)
    // Guards against a regression that drops the event_id scoping from the select query —
    // without this, the mock's canned rows would let the test pass even if the real query
    // wasn't actually filtered by event_id.
    expect(selectChain.eq).toHaveBeenCalledWith('event_id', EVENT_ID)
    expect(selectChain.in).toHaveBeenCalledWith('id', [ID_A, ID_B, ID_OTHER_EVENT])
  })

  it('rejects a batch over 100 ids with 400', async () => {
    const { mock } = makeSupabaseMock([])
    createServerClientMock.mockReturnValue(mock)
    const ids = Array.from({ length: 101 }, () => ID_A)
    const res = await POST(req({ ids }), ctx)
    expect(res.status).toBe(400)
  })

  it('returns 404 when the event is not owned by the caller', async () => {
    const { mock } = makeSupabaseMock([])
    mock.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'events') {
        const chain: Record<string, unknown> = { select: vi.fn(), eq: vi.fn(), is: vi.fn() }
        chain.select = vi.fn().mockReturnValue(chain)
        chain.eq = vi.fn().mockReturnValue(chain)
        chain.is = vi.fn().mockReturnValue(chain)
        chain.single = vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } })
        return chain
      }
      return makeMediaChain([]).selectChain
    })
    createServerClientMock.mockReturnValue(mock)
    const res = await POST(req({ ids: [ID_A] }), ctx)
    expect(res.status).toBe(404)
  })
})
