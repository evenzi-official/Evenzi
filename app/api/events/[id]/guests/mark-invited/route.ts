import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { requireEventWrite } from '@/lib/auth/eventAccess'
import { uuidSchema } from '@/lib/validations/guests'
import { z } from 'zod'

// Cap the batch so a crafted request can't hand Postgres a huge ANY() array
// (council 2026-08-26 — lock-amplification / DoS guard). The guided send flow
// only ever sends one id at a time, so 500 is comfortably above real use.
const markInvitedSchema = z.object({
  guestIds: z.array(uuidSchema).min(1).max(500),
  invited: z.boolean().optional().default(true),
})

/**
 * POST /api/events/[id]/guests/mark-invited
 *
 * Marks the given guests invited (or un-marks them with `{ invited: false }`).
 * Used by the WhatsApp send flow: a guest is marked invited when the host opens
 * WhatsApp for them, and can be reverted via the undo toast / "Mark not invited".
 * The UPDATE is event-scoped (event_id = id AND id = ANY(guestIds)) so a foreign
 * guest id simply matches nothing — mirrors the bulk-complete RPC fix.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const access = await requireEventWrite(supabase, id, user.id, 'guests')
    if (!access.ok) return access.response

    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = markInvitedSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const { guestIds, invited } = parsed.data

    const { data: updated, error: updateError } = await supabase
      .from('event_guests')
      .update({ invited })
      .eq('event_id', id)
      .in('id', guestIds)
      .select('id')

    if (updateError) {
      console.error('POST /api/events/[id]/guests/mark-invited failed:', updateError)
      return NextResponse.json({ error: 'Failed to update guests' }, { status: 500 })
    }

    return NextResponse.json({ updated: updated?.length ?? 0 }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
