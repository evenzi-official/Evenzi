import { describe, it, expect, vi } from 'vitest'
import { getEventAccess, requireEventWrite, type EventRole, type EventCapability } from '@/lib/auth/eventAccess'

function makeSupabase(opts: { isOwner: boolean; collabRole?: string; collabStatus?: string }) {
  return {
    from: vi.fn().mockImplementation((table: string) => {
      const chain: Record<string, unknown> = {}
      chain.select = vi.fn().mockReturnValue(chain)
      chain.eq = vi.fn().mockReturnValue(chain)
      chain.is = vi.fn().mockReturnValue(chain)
      if (table === 'events') {
        chain.single = vi.fn().mockResolvedValue(
          opts.isOwner ? { data: { id: 'event-1' }, error: null } : { data: null, error: { message: 'not found' } }
        )
      } else if (table === 'event_collaborators') {
        chain.single = vi.fn().mockResolvedValue(
          opts.collabRole
            ? { data: { role: opts.collabRole }, error: null }
            : { data: null, error: { message: 'not found' } }
        )
      }
      return chain
    }),
  }
}

describe('getEventAccess', () => {
  it('returns owner role when the caller owns the event', async () => {
    const access = await getEventAccess(makeSupabase({ isOwner: true }) as never, 'event-1', 'user-1')
    expect(access.role).toBe('owner')
    expect(access.canWrite('billing')).toBe(true)
    expect(access.canWrite('delete')).toBe(true)
  })

  it('returns co-host role with billing/delete excluded', async () => {
    const access = await getEventAccess(makeSupabase({ isOwner: false, collabRole: 'co-host' }) as never, 'event-1', 'user-2')
    expect(access.role).toBe('co-host')
    expect(access.canWrite('website')).toBe(true)
    expect(access.canWrite('billing')).toBe(false)
    expect(access.canWrite('delete')).toBe(false)
  })

  it('scopes planner to guests+planning only', async () => {
    const access = await getEventAccess(makeSupabase({ isOwner: false, collabRole: 'planner' }) as never, 'event-1', 'user-3')
    expect(access.canWrite('guests')).toBe(true)
    expect(access.canWrite('planning')).toBe(true)
    expect(access.canWrite('website')).toBe(false)
    expect(access.canRead('website')).toBe(false)
  })

  it('scopes photographer to media only', async () => {
    const access = await getEventAccess(makeSupabase({ isOwner: false, collabRole: 'photographer' }) as never, 'event-1', 'user-4')
    expect(access.canWrite('media')).toBe(true)
    expect(access.canWrite('guests')).toBe(false)
  })

  it('viewer can read everything but write nothing', async () => {
    const access = await getEventAccess(makeSupabase({ isOwner: false, collabRole: 'viewer' }) as never, 'event-1', 'user-5')
    expect(access.canRead('billing')).toBe(true)
    expect(access.canWrite('billing')).toBe(false)
    expect(access.canWrite('media')).toBe(false)
  })

  it('returns null role for a non-owner, non-collaborator caller', async () => {
    const access = await getEventAccess(makeSupabase({ isOwner: false }) as never, 'event-1', 'user-6')
    expect(access.role).toBeNull()
    expect(access.canRead('general')).toBe(false)
  })
})

describe('requireEventWrite', () => {
  it('returns ok:false with a 404 response when the capability check fails', async () => {
    const result = await requireEventWrite(makeSupabase({ isOwner: false }) as never, 'event-1', 'user-6', 'general')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(404)
  })

  it('returns ok:true when the capability check passes', async () => {
    const result = await requireEventWrite(makeSupabase({ isOwner: true }) as never, 'event-1', 'user-1', 'general')
    expect(result.ok).toBe(true)
  })
})

// Drift-guard (round-2 council, Security Expert): pins the capability model so an
// accidental edit to CAPABILITY_MATRIX fails loudly. This is the TS half; the SQL
// predicates can_read_event/can_write_event (Task 13) must be updated in lockstep —
// there is no automated cross-check between the two, so this test's failure is the
// signal to also re-check the migration.
describe('capability model — drift guard', () => {
  const cases: Array<[EventRole, EventCapability, 'read+write' | 'read-only' | 'none']> = [
    ['owner', 'billing', 'read+write'], ['owner', 'delete', 'read+write'], ['owner', 'general', 'read+write'],
    ['co-host', 'general', 'read+write'], ['co-host', 'website', 'read+write'], ['co-host', 'billing', 'none'], ['co-host', 'delete', 'none'],
    ['planner', 'planning', 'read+write'], ['planner', 'guests', 'read+write'], ['planner', 'website', 'none'], ['planner', 'media', 'none'],
    ['photographer', 'media', 'read+write'], ['photographer', 'guests', 'none'], ['photographer', 'planning', 'none'],
    ['viewer', 'billing', 'read-only'], ['viewer', 'media', 'read-only'], ['viewer', 'guests', 'read-only'],
  ]
  it.each(cases)('%s + %s → %s', async (role, cap, expected) => {
    const isOwner = role === 'owner'
    const access = await getEventAccess(makeSupabase({ isOwner, collabRole: isOwner ? undefined : role }) as never, 'event-1', 'u')
    expect(access.canRead(cap)).toBe(expected !== 'none')
    expect(access.canWrite(cap)).toBe(expected === 'read+write')
  })
})
