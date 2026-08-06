import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { requireEventWrite } from '@/lib/auth/eventAccess'
import { notifyRecipientsSafe } from '@/lib/notifications/notify'
import { updateGuestSchema, uuidSchema } from '@/lib/validations/guests'

async function fireRsvpReceivedNotification(
  eventId: string,
  actorId: string,
  guestId: string,
  guestName: string,
  newStatusId: string,
): Promise<void> {
  const supabase = await createClient()
  const [{ data: statusRow }, { data: eventRow }, { data: guestSubEvent }] = await Promise.all([
    supabase.schema('config').from('rsvp_statuses').select('name').eq('id', newStatusId).single(),
    supabase.from('events').select('name').eq('id', eventId).single(),
    supabase
      .from('event_guest_sub_events')
      .select('sub_event_id')
      .eq('guest_id', guestId)
      .eq('event_id', eventId)
      .limit(1)
      .maybeSingle(),
  ])

  let forLabel = eventRow?.name ?? 'the event'
  if (guestSubEvent?.sub_event_id) {
    const { data: subEventRow } = await supabase
      .from('event_sub_events')
      .select('custom_name, event_sub_type_id')
      .eq('id', guestSubEvent.sub_event_id)
      .single()
    const custom = subEventRow?.custom_name?.trim()
    if (custom) {
      forLabel = custom
    } else if (subEventRow?.event_sub_type_id) {
      const { data: typeRow } = await supabase
        .schema('config')
        .from('event_sub_types')
        .select('name')
        .eq('id', subEventRow.event_sub_type_id)
        .single()
      if (typeRow?.name) forLabel = typeRow.name
    }
  }

  const statusLabel = (statusRow?.name ?? 'updated').toLowerCase()
  await notifyRecipientsSafe({
    eventId,
    actorId,
    type: 'rsvp_received',
    title: guestName,
    body: `${statusLabel} for ${forLabel}`,
    linkPath: `/events/${eventId}/guests`,
  })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; guestId: string }> }
): Promise<NextResponse> {
  try {
    const { id, guestId } = await params
    if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(guestId).success) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
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

    const parsed = updateGuestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const { name, phone, email, partySize, notes, rsvpStatusId, subEventIds, tagIds } = parsed.data

    let rsvpNotify: { guestName: string; newStatusId: string } | null = null
    if (rsvpStatusId !== undefined) {
      const { data: existingGuest } = await supabase
        .from('event_guests')
        .select('rsvp_status_id, name')
        .eq('id', guestId)
        .eq('event_id', id)
        .single()

      if (existingGuest && existingGuest.rsvp_status_id !== rsvpStatusId) {
        rsvpNotify = { guestName: existingGuest.name, newStatusId: rsvpStatusId }
      }
    }

    const patch: Record<string, unknown> = {}
    if (name !== undefined) patch.name = name
    if (phone !== undefined) patch.phone = phone
    if (email !== undefined) patch.email = email
    if (partySize !== undefined) patch.party_size = partySize
    if (notes !== undefined) patch.notes = notes
    if (rsvpStatusId !== undefined) patch.rsvp_status_id = rsvpStatusId

    if (Object.keys(patch).length > 0) {
      const { data: updatedRows, error: updateError } = await supabase
        .from('event_guests')
        .update(patch)
        .eq('id', guestId)
        .eq('event_id', id)
        .select('id')

      if (updateError) {
        console.error('PATCH /api/events/[id]/guests/[guestId] failed:', updateError)
        return NextResponse.json({ error: 'Failed to update guest' }, { status: 500 })
      }
      if (!updatedRows || updatedRows.length === 0) {
        return NextResponse.json({ error: 'Guest not found' }, { status: 404 })
      }
    }

    if (subEventIds !== undefined) {
      const { error: delError } = await supabase
        .from('event_guest_sub_events')
        .delete()
        .eq('guest_id', guestId)
        .eq('event_id', id)
      if (delError) {
        console.error('PATCH /api/events/[id]/guests/[guestId]: clearing functions failed:', delError)
        return NextResponse.json({ error: 'Failed to update functions' }, { status: 500 })
      }
      if (subEventIds.length > 0) {
        const { error: insError } = await supabase
          .from('event_guest_sub_events')
          .insert(subEventIds.map((subEventId) => ({ event_id: id, guest_id: guestId, sub_event_id: subEventId })))
        if (insError) {
          console.error('PATCH /api/events/[id]/guests/[guestId]: assigning functions failed:', insError)
          return NextResponse.json({ error: 'Failed to update functions' }, { status: 500 })
        }
      }
    }

    if (tagIds !== undefined) {
      const { error: delTagError } = await supabase
        .from('event_guest_tag_links')
        .delete()
        .eq('guest_id', guestId)
        .eq('event_id', id)
      if (delTagError) {
        console.error('PATCH /api/events/[id]/guests/[guestId]: clearing tags failed:', delTagError)
        return NextResponse.json({ error: 'Failed to update tags' }, { status: 500 })
      }
      if (tagIds.length > 0) {
        const { error: insTagError } = await supabase
          .from('event_guest_tag_links')
          .insert(tagIds.map((tagId) => ({ event_id: id, guest_id: guestId, tag_id: tagId })))
        if (insTagError) {
          console.error('PATCH /api/events/[id]/guests/[guestId]: tagging failed:', insTagError)
          return NextResponse.json({ error: 'Failed to update tags' }, { status: 500 })
        }
      }
    }

    if (rsvpNotify) {
      void fireRsvpReceivedNotification(id, user.id, guestId, rsvpNotify.guestName, rsvpNotify.newStatusId)
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; guestId: string }> }
): Promise<NextResponse> {
  try {
    const { id, guestId } = await params
    if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(guestId).success) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const access = await requireEventWrite(supabase, id, user.id, 'guests')
    if (!access.ok) return access.response

    const { data: deletedRows, error } = await supabase
      .from('event_guests')
      .delete()
      .eq('id', guestId)
      .eq('event_id', id)
      .select('id')

    if (error) {
      console.error('DELETE /api/events/[id]/guests/[guestId] failed:', error)
      return NextResponse.json({ error: 'Failed to remove guest' }, { status: 500 })
    }
    if (!deletedRows || deletedRows.length === 0) {
      return NextResponse.json({ error: 'Guest not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
