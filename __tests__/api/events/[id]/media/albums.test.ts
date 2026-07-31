import { describe, it, expect, vi, beforeEach } from 'vitest'

const { createServerClientMock } = vi.hoisted(() => ({ createServerClientMock: vi.fn() }))
vi.mock('@supabase/ssr', () => ({ createServerClient: createServerClientMock }))
vi.mock('next/headers', () => ({ cookies: vi.fn().mockResolvedValue({ getAll: () => [], set: vi.fn() }) }))

import { POST as createAlbum } from '@/app/api/events/[id]/media/albums/route'
import { PATCH as renameAlbum } from '@/app/api/events/[id]/media/albums/[albumId]/route'
import { PATCH as assignAlbums } from '@/app/api/events/[id]/media/[mediaId]/albums/route'

const EVENT_ID = '550e8400-e29b-41d4-a716-446655440000'
const ALBUM_ID = '660e8400-e29b-41d4-a716-446655440001'
const MEDIA_ID = '770e8400-e29b-41d4-a716-446655440002'

function makeOwnerChain() {
  const chain: Record<string, unknown> = { select: vi.fn(), eq: vi.fn(), is: vi.fn() }
  chain.select = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.is = vi.fn().mockReturnValue(chain)
  chain.single = vi.fn().mockResolvedValue({ data: { id: EVENT_ID }, error: null })
  return chain
}

describe('POST /api/events/[id]/media/albums (create)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 409 with a friendly message on a duplicate name (23505)', async () => {
    const insertChain: Record<string, unknown> = { insert: vi.fn(), select: vi.fn() }
    insertChain.insert = vi.fn().mockReturnValue(insertChain)
    insertChain.select = vi.fn().mockReturnValue(insertChain)
    insertChain.single = vi.fn().mockResolvedValue({ data: null, error: { code: '23505', message: 'duplicate key' } })

    createServerClientMock.mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
      from: vi.fn().mockImplementation((table: string) => (table === 'events' ? makeOwnerChain() : insertChain)),
    })

    const req = new Request(`http://localhost/api/events/${EVENT_ID}/media/albums`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Sangeet' }),
    })
    const res = await createAlbum(req, { params: Promise.resolve({ id: EVENT_ID }) })
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error).toBe('An album with this name already exists')
  })
})

describe('PATCH /api/events/[id]/media/albums/[albumId] (rename)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 409 with a friendly message on a duplicate name (23505)', async () => {
    const updateChain: Record<string, unknown> = { update: vi.fn(), eq: vi.fn(), select: vi.fn() }
    updateChain.update = vi.fn().mockReturnValue(updateChain)
    updateChain.eq = vi.fn().mockReturnValue(updateChain)
    updateChain.select = vi.fn().mockReturnValue(updateChain)
    updateChain.single = vi.fn().mockResolvedValue({ data: null, error: { code: '23505', message: 'duplicate key' } })

    createServerClientMock.mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
      from: vi.fn().mockImplementation((table: string) => (table === 'events' ? makeOwnerChain() : updateChain)),
    })

    const req = new Request(`http://localhost/api/events/${EVENT_ID}/media/albums/${ALBUM_ID}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Sangeet' }),
    })
    const res = await renameAlbum(req, { params: Promise.resolve({ id: EVENT_ID, albumId: ALBUM_ID }) })
    expect(res.status).toBe(409)
  })
})

describe('PATCH /api/events/[id]/media/[mediaId]/albums (assign)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('treats an add-on-already-present album as a no-op success (23505 swallowed)', async () => {
    const insertChain: Record<string, unknown> = { insert: vi.fn() }
    insertChain.insert = vi.fn().mockResolvedValue({ error: { code: '23505', message: 'duplicate key' } })

    createServerClientMock.mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
      from: vi.fn().mockImplementation((table: string) => (table === 'events' ? makeOwnerChain() : insertChain)),
    })

    const req = new Request(`http://localhost/api/events/${EVENT_ID}/media/${MEDIA_ID}/albums`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'add', albumIds: [ALBUM_ID] }),
    })
    const res = await assignAlbums(req, { params: Promise.resolve({ id: EVENT_ID, mediaId: MEDIA_ID }) })
    expect(res.status).toBe(200)
  })

  it('returns 400 for an invalid mode', async () => {
    createServerClientMock.mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
      from: vi.fn().mockReturnValue(makeOwnerChain()),
    })
    const req = new Request(`http://localhost/api/events/${EVENT_ID}/media/${MEDIA_ID}/albums`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'replace', albumIds: [ALBUM_ID] }),
    })
    const res = await assignAlbums(req, { params: Promise.resolve({ id: EVENT_ID, mediaId: MEDIA_ID }) })
    expect(res.status).toBe(400)
  })
})
