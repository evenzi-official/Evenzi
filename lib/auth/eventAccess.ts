import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'

export type EventRole = 'owner' | 'co-host' | 'planner' | 'photographer' | 'viewer'

export type EventCapability =
  | 'billing'
  | 'delete'
  | 'admins'
  | 'website'
  | 'guests'
  | 'planning'
  | 'media'
  | 'general'

// ⚠️ This matrix MUST stay in sync with the SQL predicates public.can_read_event() /
// public.can_write_event() (Task 13 Step 1). They are two hand-maintained copies of the
// same capability model — if you change one, change the other. The drift-guard test in
// __tests__/lib/auth/eventAccess.test.ts pins this matrix so an accidental TS-side edit
// fails loudly; there is no automated check on the SQL side, so treat any change here as
// a paired change to the migration.
const CAPABILITY_MATRIX: Record<EventRole, ReadonlySet<EventCapability>> = {
  owner:        new Set(['billing', 'delete', 'admins', 'website', 'guests', 'planning', 'media', 'general']),
  'co-host':    new Set(['admins', 'website', 'guests', 'planning', 'media', 'general']),
  planner:      new Set(['guests', 'planning']),
  photographer: new Set(['media']),
  viewer:       new Set([]),
}

export interface EventAccess {
  role: EventRole | null
  canWrite: (capability: EventCapability) => boolean
  canRead: (capability: EventCapability) => boolean
}

function isEventRole(value: string): value is EventRole {
  return value === 'owner' || value === 'co-host' || value === 'planner' || value === 'photographer' || value === 'viewer'
}

function buildAccess(role: EventRole | null): EventAccess {
  const capabilities = role ? CAPABILITY_MATRIX[role] : new Set<EventCapability>()
  return {
    role,
    canWrite: (capability) => role !== null && role !== 'viewer' && capabilities.has(capability),
    canRead: (capability) => role !== null && (role === 'viewer' || capabilities.has(capability)),
  }
}

export async function getEventAccess(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  eventId: string,
  userId: string
): Promise<EventAccess> {
  const { data: owned } = await supabase
    .from('events')
    .select('id')
    .eq('id', eventId)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .single()

  if (owned) return buildAccess('owner')

  const { data: collab } = await supabase
    .from('event_collaborators')
    .select('role')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  if (collab && isEventRole(collab.role)) return buildAccess(collab.role)

  return buildAccess(null)
}

export async function requireEventWrite(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  eventId: string,
  userId: string,
  capability: EventCapability
): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  const access = await getEventAccess(supabase, eventId, userId)
  if (!access.canWrite(capability)) {
    return { ok: false, response: NextResponse.json({ error: 'Not found' }, { status: 404 }) }
  }
  return { ok: true }
}

export async function requireEventRead(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  eventId: string,
  userId: string,
  capability: EventCapability
): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  const access = await getEventAccess(supabase, eventId, userId)
  if (!access.canRead(capability)) {
    return { ok: false, response: NextResponse.json({ error: 'Not found' }, { status: 404 }) }
  }
  return { ok: true }
}
