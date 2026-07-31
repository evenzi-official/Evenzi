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

// Mocks the event_media existence check (`.select('id').eq('event_id', id).eq('id', mediaId).single()`).
function makeMediaExistsChain(exists: boolean) {
  const chain: Record<string, unknown> = { select: vi.fn(), eq: vi.fn() }
  chain.select = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.single = vi.fn().mockResolvedValue({ data: exists ? { id: MEDIA_ID } : null, error: null })
  return chain
}

// Mocks the event_albums ownership check (`.select('id').eq('event_id', id).in('id', albumIds)`).
function makeAlbumsFoundChain(foundIds: string[]) {
  const chain: Record<string, unknown> = { select: vi.fn(), eq: vi.fn(), in: vi.fn() }
  chain.select = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.in = vi.fn().mockResolvedValue({ data: foundIds.map((foundId) => ({ id: foundId })), error: null })
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
    // Guards against a regression that drops event_id from the insert payload.
    expect(insertChain.insert).toHaveBeenCalledWith(expect.objectContaining({ event_id: EVENT_ID }))
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
    // Guards against a regression that drops the id/event_id scoping from the update query.
    expect(updateChain.eq).toHaveBeenCalledWith('id', ALBUM_ID)
    expect(updateChain.eq).toHaveBeenCalledWith('event_id', EVENT_ID)
  })
})

describe('PATCH /api/events/[id]/media/[mediaId]/albums (assign)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('treats an add-on-already-present album as a no-op success (23505 swallowed)', async () => {
    const mediaChain = makeMediaExistsChain(true)
    const albumsChain = makeAlbumsFoundChain([ALBUM_ID])
    const insertChain: Record<string, unknown> = { insert: vi.fn() }
    insertChain.insert = vi.fn().mockResolvedValue({ error: { code: '23505', message: 'duplicate key' } })

    createServerClientMock.mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'events') return makeOwnerChain()
        if (table === 'event_media') return mediaChain
        if (table === 'event_albums') return albumsChain
        return insertChain
      }),
    })

    const req = new Request(`http://localhost/api/events/${EVENT_ID}/media/${MEDIA_ID}/albums`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'add', albumIds: [ALBUM_ID] }),
    })
    const res = await assignAlbums(req, { params: Promise.resolve({ id: EVENT_ID, mediaId: MEDIA_ID }) })
    expect(res.status).toBe(200)
    // Guards against a regression that drops the mediaId/albumId event-scoping checks.
    expect(mediaChain.eq).toHaveBeenCalledWith('event_id', EVENT_ID)
    expect(mediaChain.eq).toHaveBeenCalledWith('id', MEDIA_ID)
    expect(albumsChain.eq).toHaveBeenCalledWith('event_id', EVENT_ID)
    expect(albumsChain.in).toHaveBeenCalledWith('id', [ALBUM_ID])
  })

  it('returns 400 for an invalid mode', async () => {
    const ownerChain = makeOwnerChain()
    createServerClientMock.mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
      from: vi.fn().mockReturnValue(ownerChain),
    })
    const req = new Request(`http://localhost/api/events/${EVENT_ID}/media/${MEDIA_ID}/albums`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'replace', albumIds: [ALBUM_ID] }),
    })
    const res = await assignAlbums(req, { params: Promise.resolve({ id: EVENT_ID, mediaId: MEDIA_ID }) })
    expect(res.status).toBe(400)
    // Validation fails before any mediaId/albumId lookup — only the ownership check should run.
    expect(ownerChain.eq).toHaveBeenCalledWith('id', EVENT_ID)
    expect(ownerChain.eq).toHaveBeenCalledWith('user_id', 'user-1')
  })

  it('returns 404 when mediaId does not resolve under this event', async () => {
    const mediaChain = makeMediaExistsChain(false)

    createServerClientMock.mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'events') return makeOwnerChain()
        if (table === 'event_media') return mediaChain
        throw new Error(`unexpected table access: ${table}`)
      }),
    })

    const req = new Request(`http://localhost/api/events/${EVENT_ID}/media/${MEDIA_ID}/albums`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'remove', albumIds: [ALBUM_ID] }),
    })
    const res = await assignAlbums(req, { params: Promise.resolve({ id: EVENT_ID, mediaId: MEDIA_ID }) })
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('Media not found')
    expect(mediaChain.eq).toHaveBeenCalledWith('event_id', EVENT_ID)
    expect(mediaChain.eq).toHaveBeenCalledWith('id', MEDIA_ID)
  })

  it('returns 404 when an albumId does not resolve under this event (add mode)', async () => {
    const mediaChain = makeMediaExistsChain(true)
    const albumsChain = makeAlbumsFoundChain([]) // ALBUM_ID not found under this event

    createServerClientMock.mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'events') return makeOwnerChain()
        if (table === 'event_media') return mediaChain
        if (table === 'event_albums') return albumsChain
        throw new Error(`unexpected table access: ${table}`)
      }),
    })

    const req = new Request(`http://localhost/api/events/${EVENT_ID}/media/${MEDIA_ID}/albums`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'add', albumIds: [ALBUM_ID] }),
    })
    const res = await assignAlbums(req, { params: Promise.resolve({ id: EVENT_ID, mediaId: MEDIA_ID }) })
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('One or more albums not found')
    expect(albumsChain.eq).toHaveBeenCalledWith('event_id', EVENT_ID)
    expect(albumsChain.in).toHaveBeenCalledWith('id', [ALBUM_ID])
  })
})
