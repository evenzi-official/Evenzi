import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'

/** Map accept/decline / list_my_pending_invites Postgres exception text → HTTP. */
export function mapInviteRpcError(message: string): NextResponse {
  const msg = message.toLowerCase()

  if (msg.includes('not authenticated')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (msg.includes('wrong account') || msg.includes('email not confirmed')) {
    return NextResponse.json(
      { error: msg.includes('email not confirmed') ? 'Email not confirmed' : 'Wrong account' },
      { status: 403 },
    )
  }
  if (msg.includes('invalid invite') || msg.includes('event deleted')) {
    return NextResponse.json(
      { error: msg.includes('event deleted') ? 'Event not found' : 'Invite not found' },
      { status: 404 },
    )
  }
  if (msg.includes('not pending')) {
    return NextResponse.json({ error: 'Invite is not pending' }, { status: 409 })
  }

  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}

type InviteAction = 'accept' | 'decline'

const RPC_BY_ACTION: Record<InviteAction, 'accept_event_invite' | 'decline_event_invite'> = {
  accept: 'accept_event_invite',
  decline: 'decline_event_invite',
}

/** Call accept_event_invite / decline_event_invite and map errors to HTTP. */
export async function runInviteAction(
  supabase: SupabaseClient,
  token: string,
  action: InviteAction,
): Promise<NextResponse> {
  const { data: eventId, error } = await supabase.rpc(RPC_BY_ACTION[action], {
    p_token: token,
  })

  if (error) {
    console.error(`[collaborators/invites] ${RPC_BY_ACTION[action]} failed:`, error)
    return mapInviteRpcError(error.message ?? '')
  }

  if (!eventId) {
    return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true, eventId }, { status: 200 })
}

type PendingInviteRow = {
  id: string
  event_id: string
}

/**
 * Resolve pending invite for (eventId, caller email) via list_my_pending_invites,
 * then accept or decline.
 */
export async function runInviteActionByEvent(
  supabase: SupabaseClient,
  eventId: string,
  action: InviteAction,
): Promise<NextResponse> {
  const { data: pending, error: listError } = await supabase.rpc('list_my_pending_invites')

  if (listError) {
    console.error('[collaborators/invites] list_my_pending_invites failed:', listError)
    return mapInviteRpcError(listError.message ?? '')
  }

  const rows = (pending ?? []) as PendingInviteRow[]
  const match = rows.find((row) => row.event_id === eventId)

  if (!match) {
    return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
  }

  return runInviteAction(supabase, match.id, action)
}
