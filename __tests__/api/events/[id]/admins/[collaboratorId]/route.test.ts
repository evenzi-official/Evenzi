import { describe, it, expect, vi, beforeEach } from 'vitest'

const { createServerClientMock } = vi.hoisted(() => ({ createServerClientMock: vi.fn() }))
vi.mock('@supabase/ssr', () => ({ createServerClient: createServerClientMock }))
vi.mock('next/headers', () => ({ cookies: vi.fn().mockResolvedValue({ getAll: () => [], set: vi.fn() }) }))

import { DELETE, PATCH } from '@/app/api/events/[id]/admins/[collaboratorId]/route'

const EVENT_ID = '550e8400-e29b-41d4-a716-446655440000'
const COLLAB_ID = '660e8400-e29b-41d4-a716-446655440001'

function makeChain(terminal: unknown) {
  const chain: Record<string, unknown> = {}
  const self = () => chain
  chain.select = vi.fn().mockImplementation(self)
  chain.eq = vi.fn().mockImplementation(self)
  chain.is = vi.fn().mockImplementation(self)
  chain.delete = vi.fn().mockImplementation(self)
  chain.update = vi.fn().mockImplementation(self)
  chain.single = vi.fn().mockResolvedValue(terminal)
  // Final .eq() after delete/update resolves the mutation result
  let eqCount = 0
  chain.eq = vi.fn().mockImplementation(() => {
    eqCount += 1
    // After select path, eq stays chainable; after delete/update + 2 eqs, resolve
    return chain
  })
  // Make the chain thenable so `await supabase.from().delete().eq().eq()` works
  ;(chain as { then?: unknown }).then = undefined
  Object.defineProperty(chain, 'then', {
    configurable: true,
    get() {
      // Only act as a promise when awaited after a mutation started
      if ((chain.delete as ReturnType<typeof vi.fn>).mock.calls.length > 0
        || (chain.update as ReturnType<typeof vi.fn>).mock.calls.length > 0) {
        return (resolve: (v: unknown) => void) => resolve({ error: null })
      }
      return undefined
    },
  })
  return chain
}

function makeSupabase(opts: {
  isOwner: boolean
  collabRole?: string
  targetUserId?: string
}) {
  let collabSelectCalls = 0
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'events') {
        return makeChain(
          opts.isOwner
            ? { data: { id: EVENT_ID }, error: null }
            : { data: null, error: { message: 'not found' } }
        )
      }
      if (table === 'event_collaborators') {
        collabSelectCalls += 1
        // First collab hit from getEventAccess (role lookup) when not owner;
        // subsequent hits are the lockout-guard target lookup.
        if (!opts.isOwner && collabSelectCalls === 1 && opts.collabRole) {
          return makeChain({ data: { role: opts.collabRole }, error: null })
        }
        return makeChain({
          data: { user_id: opts.targetUserId ?? 'user-2' },
          error: null,
        })
      }
      return makeChain({ data: null, error: { message: 'not found' } })
    }),
  }
}

const ctx = { params: Promise.resolve({ id: EVENT_ID, collaboratorId: COLLAB_ID }) }

describe('DELETE /api/events/[id]/admins/[collaboratorId]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY = 'test-key'
  })

  it('rejects a non-owner, non-co-host caller with 404', async () => {
    createServerClientMock.mockReturnValue(makeSupabase({ isOwner: false }))
    const req = new Request(`http://localhost/api/events/${EVENT_ID}/admins/${COLLAB_ID}`, { method: 'DELETE' })
    const res = await DELETE(req, ctx)
    expect(res.status).toBe(404)
  })

  it('removes the collaborator when the caller is the owner', async () => {
    createServerClientMock.mockReturnValue(makeSupabase({ isOwner: true }))
    const req = new Request(`http://localhost/api/events/${EVENT_ID}/admins/${COLLAB_ID}`, { method: 'DELETE' })
    const res = await DELETE(req, ctx)
    expect(res.status).toBe(204)
  })

  it('rejects self-removal by a co-host with 400', async () => {
    createServerClientMock.mockReturnValue(makeSupabase({
      isOwner: false,
      collabRole: 'co-host',
      targetUserId: 'user-1',
    }))
    const req = new Request(`http://localhost/api/events/${EVENT_ID}/admins/${COLLAB_ID}`, { method: 'DELETE' })
    const res = await DELETE(req, ctx)
    expect(res.status).toBe(400)
  })
})

describe('PATCH /api/events/[id]/admins/[collaboratorId]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY = 'test-key'
  })

  it('updates the role when the caller has admins capability', async () => {
    createServerClientMock.mockReturnValue(makeSupabase({ isOwner: true }))
    const req = new Request(`http://localhost/api/events/${EVENT_ID}/admins/${COLLAB_ID}`, {
      method: 'PATCH',
      body: JSON.stringify({ role: 'planner' }),
    })
    const res = await PATCH(req, ctx)
    expect(res.status).toBe(200)
  })

  it('rejects role: "owner" with 400 — the escalation vector the council found', async () => {
    createServerClientMock.mockReturnValue(makeSupabase({ isOwner: true }))
    const req = new Request(`http://localhost/api/events/${EVENT_ID}/admins/${COLLAB_ID}`, {
      method: 'PATCH',
      body: JSON.stringify({ role: 'owner' }),
    })
    const res = await PATCH(req, ctx)
    expect(res.status).toBe(400)
  })

  it('rejects an unrecognized role string with 400', async () => {
    createServerClientMock.mockReturnValue(makeSupabase({ isOwner: true }))
    const req = new Request(`http://localhost/api/events/${EVENT_ID}/admins/${COLLAB_ID}`, {
      method: 'PATCH',
      body: JSON.stringify({ role: 'super-admin' }),
    })
    const res = await PATCH(req, ctx)
    expect(res.status).toBe(400)
  })
})
