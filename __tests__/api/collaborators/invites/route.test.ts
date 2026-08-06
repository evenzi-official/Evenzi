import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock,
}))

import { POST as acceptById } from '@/app/api/collaborators/invites/[collaboratorId]/accept/route'
import { POST as declineById } from '@/app/api/collaborators/invites/[collaboratorId]/decline/route'
import { POST as acceptByEvent } from '@/app/api/collaborators/invites/by-event/[eventId]/accept/route'
import { POST as declineByEvent } from '@/app/api/collaborators/invites/by-event/[eventId]/decline/route'

const COLLAB_ID = '660e8400-e29b-41d4-a716-446655440001'
const EVENT_ID = '550e8400-e29b-41d4-a716-446655440000'
const OTHER_EVENT_ID = '550e8400-e29b-41d4-a716-446655440099'

function makeSupabase(opts: {
  user?: { id: string } | null
  rpc?: (name: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>
}) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: opts.user === undefined ? { id: 'user-1' } : opts.user },
        error: opts.user === null ? { message: 'no session' } : null,
      }),
    },
    rpc: opts.rpc ?? vi.fn().mockResolvedValue({ data: EVENT_ID, error: null }),
  }
}

const idCtx = { params: Promise.resolve({ collaboratorId: COLLAB_ID }) }
const eventCtx = { params: Promise.resolve({ eventId: EVENT_ID }) }

describe('POST /api/collaborators/invites/[collaboratorId]/accept', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when unauthenticated', async () => {
    createClientMock.mockResolvedValue(makeSupabase({ user: null }))
    const res = await acceptById(new Request('http://localhost/accept', { method: 'POST' }), idCtx)
    expect(res.status).toBe(401)
  })

  it('returns 403 on wrong account', async () => {
    createClientMock.mockResolvedValue(makeSupabase({
      rpc: vi.fn().mockResolvedValue({ data: null, error: { message: 'wrong account' } }),
    }))
    const res = await acceptById(new Request('http://localhost/accept', { method: 'POST' }), idCtx)
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('Wrong account')
  })

  it('returns 404 on invalid invite', async () => {
    createClientMock.mockResolvedValue(makeSupabase({
      rpc: vi.fn().mockResolvedValue({ data: null, error: { message: 'invalid invite' } }),
    }))
    const res = await acceptById(new Request('http://localhost/accept', { method: 'POST' }), idCtx)
    expect(res.status).toBe(404)
  })

  it('returns 409 when invite is not pending', async () => {
    createClientMock.mockResolvedValue(makeSupabase({
      rpc: vi.fn().mockResolvedValue({ data: null, error: { message: 'not pending' } }),
    }))
    const res = await acceptById(new Request('http://localhost/accept', { method: 'POST' }), idCtx)
    expect(res.status).toBe(409)
  })

  it('returns 200 with eventId on success', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: EVENT_ID, error: null })
    createClientMock.mockResolvedValue(makeSupabase({ rpc }))
    const res = await acceptById(new Request('http://localhost/accept', { method: 'POST' }), idCtx)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ success: true, eventId: EVENT_ID })
    expect(rpc).toHaveBeenCalledWith('accept_event_invite', { p_token: COLLAB_ID })
  })
})

describe('POST /api/collaborators/invites/[collaboratorId]/decline', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 403 on wrong account', async () => {
    createClientMock.mockResolvedValue(makeSupabase({
      rpc: vi.fn().mockResolvedValue({ data: null, error: { message: 'wrong account' } }),
    }))
    const res = await declineById(new Request('http://localhost/decline', { method: 'POST' }), idCtx)
    expect(res.status).toBe(403)
  })

  it('returns 200 on success', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: EVENT_ID, error: null })
    createClientMock.mockResolvedValue(makeSupabase({ rpc }))
    const res = await declineById(new Request('http://localhost/decline', { method: 'POST' }), idCtx)
    expect(res.status).toBe(200)
    expect(rpc).toHaveBeenCalledWith('decline_event_invite', { p_token: COLLAB_ID })
  })
})

describe('POST /api/collaborators/invites/by-event/[eventId]/accept', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when unauthenticated', async () => {
    createClientMock.mockResolvedValue(makeSupabase({ user: null }))
    const res = await acceptByEvent(new Request('http://localhost/accept', { method: 'POST' }), eventCtx)
    expect(res.status).toBe(401)
  })

  it('returns 403 when email not confirmed (list rpc)', async () => {
    createClientMock.mockResolvedValue(makeSupabase({
      rpc: vi.fn().mockResolvedValue({ data: null, error: { message: 'email not confirmed' } }),
    }))
    const res = await acceptByEvent(new Request('http://localhost/accept', { method: 'POST' }), eventCtx)
    expect(res.status).toBe(403)
  })

  it('returns 404 when no pending invite for event', async () => {
    createClientMock.mockResolvedValue(makeSupabase({
      rpc: vi.fn().mockResolvedValue({
        data: [{ id: COLLAB_ID, event_id: OTHER_EVENT_ID }],
        error: null,
      }),
    }))
    const res = await acceptByEvent(new Request('http://localhost/accept', { method: 'POST' }), eventCtx)
    expect(res.status).toBe(404)
  })

  it('returns 403 when accept rpc reports wrong account', async () => {
    const rpc = vi.fn()
      .mockResolvedValueOnce({
        data: [{ id: COLLAB_ID, event_id: EVENT_ID }],
        error: null,
      })
      .mockResolvedValueOnce({ data: null, error: { message: 'wrong account' } })
    createClientMock.mockResolvedValue(makeSupabase({ rpc }))
    const res = await acceptByEvent(new Request('http://localhost/accept', { method: 'POST' }), eventCtx)
    expect(res.status).toBe(403)
  })

  it('resolves token via list_my_pending_invites then accepts — 200', async () => {
    const rpc = vi.fn()
      .mockResolvedValueOnce({
        data: [{ id: COLLAB_ID, event_id: EVENT_ID }],
        error: null,
      })
      .mockResolvedValueOnce({ data: EVENT_ID, error: null })
    createClientMock.mockResolvedValue(makeSupabase({ rpc }))
    const res = await acceptByEvent(new Request('http://localhost/accept', { method: 'POST' }), eventCtx)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ success: true, eventId: EVENT_ID })
    expect(rpc).toHaveBeenNthCalledWith(1, 'list_my_pending_invites')
    expect(rpc).toHaveBeenNthCalledWith(2, 'accept_event_invite', { p_token: COLLAB_ID })
  })
})

describe('POST /api/collaborators/invites/by-event/[eventId]/decline', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('resolves token then declines — 200', async () => {
    const rpc = vi.fn()
      .mockResolvedValueOnce({
        data: [{ id: COLLAB_ID, event_id: EVENT_ID }],
        error: null,
      })
      .mockResolvedValueOnce({ data: EVENT_ID, error: null })
    createClientMock.mockResolvedValue(makeSupabase({ rpc }))
    const res = await declineByEvent(new Request('http://localhost/decline', { method: 'POST' }), eventCtx)
    expect(res.status).toBe(200)
    expect(rpc).toHaveBeenNthCalledWith(2, 'decline_event_invite', { p_token: COLLAB_ID })
  })

  it('returns 404 when invite not found', async () => {
    createClientMock.mockResolvedValue(makeSupabase({
      rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
    }))
    const res = await declineByEvent(new Request('http://localhost/decline', { method: 'POST' }), eventCtx)
    expect(res.status).toBe(404)
  })
})
