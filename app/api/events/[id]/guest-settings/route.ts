import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const uuidSchema = z.string().uuid()

const patchSchema = z.object({
  rsvp_enabled:             z.boolean().optional(),
  allow_plus_ones:          z.boolean().optional(),
  max_plus_ones_per_invite: z.number().int().min(0).max(10).optional(),
  collect_dietary_notes:    z.boolean().optional(),
  default_guest_message:    z.string().max(400).nullable().optional(),
}).strict()

function nullify(v: string | null | undefined): string | null | undefined {
  if (v === undefined) return undefined
  if (v === null) return null
  return v.trim() === '' ? null : v
}

async function verifyOwnership(supabase: Awaited<ReturnType<typeof createClient>>, eventId: string, userId: string) {
  const { data } = await supabase
    .from('events')
    .select('id')
    .eq('id', eventId)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .single()
  return !!data
}

export async function PATCH(
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

    if (!await verifyOwnership(supabase, id, user.id)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { rsvp_enabled, allow_plus_ones, max_plus_ones_per_invite, collect_dietary_notes, default_guest_message } = parsed.data

    const upsertData: Record<string, unknown> = { event_id: id, user_id: user.id }
    if (rsvp_enabled !== undefined) upsertData.rsvp_enabled = rsvp_enabled
    if (allow_plus_ones !== undefined) upsertData.allow_plus_ones = allow_plus_ones
    if (max_plus_ones_per_invite !== undefined) upsertData.max_plus_ones_per_invite = max_plus_ones_per_invite
    if (collect_dietary_notes !== undefined) upsertData.collect_dietary_notes = collect_dietary_notes
    if (default_guest_message !== undefined) upsertData.default_guest_message = nullify(default_guest_message)

    const { error } = await supabase
      .from('event_guest_settings')
      .upsert(upsertData, { onConflict: 'event_id' })

    if (error) {
      console.error('PATCH /api/events/[id]/guest-settings failed:', error)
      return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
