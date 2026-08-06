import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { requireEventWrite } from '@/lib/auth/eventAccess'
import { createGuestSchema, uuidSchema } from '@/lib/validations/guests'

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

    const parsed = createGuestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const { name, phone, email, subEventIds, tagIds } = parsed.data

    const { data: pendingStatus, error: statusError } = await supabase
      .schema('config')
      .from('rsvp_statuses')
      .select('id')
      .eq('slug', 'pending')
      .single()

    if (statusError || !pendingStatus) {
      console.error('POST /api/events/[id]/guests: pending status lookup failed:', statusError)
      return NextResponse.json({ error: 'Failed to create guest' }, { status: 500 })
    }

    const { data: guestRow, error: insertError } = await supabase
      .from('event_guests')
      .insert({
        event_id: id,
        name,
        phone,
        email: email ?? null,
        rsvp_status_id: pendingStatus.id,
        invited: false,
        party_size: 1,
        created_by: user.id,
      })
      .select('id, name, phone, email, rsvp_status_id, invited, party_size, notes, created_at')
      .single()

    if (insertError || !guestRow) {
      console.error('POST /api/events/[id]/guests failed:', insertError)
      return NextResponse.json({ error: 'Failed to create guest' }, { status: 500 })
    }

    if (subEventIds && subEventIds.length > 0) {
      const { error: seError } = await supabase
        .from('event_guest_sub_events')
        .insert(subEventIds.map((subEventId) => ({ event_id: id, guest_id: guestRow.id, sub_event_id: subEventId })))
      if (seError) {
        console.error('POST /api/events/[id]/guests: sub-event assign failed:', seError)
        return NextResponse.json({ error: 'Guest created but function assignment failed' }, { status: 500 })
      }
    }

    if (tagIds && tagIds.length > 0) {
      const { error: tagError } = await supabase
        .from('event_guest_tag_links')
        .insert(tagIds.map((tagId) => ({ event_id: id, guest_id: guestRow.id, tag_id: tagId })))
      if (tagError) {
        console.error('POST /api/events/[id]/guests: tag link failed:', tagError)
        return NextResponse.json({ error: 'Guest created but tagging failed' }, { status: 500 })
      }
    }

    return NextResponse.json({
      guest: {
        id: guestRow.id,
        name: guestRow.name,
        phone: guestRow.phone,
        email: guestRow.email,
        rsvpStatusId: guestRow.rsvp_status_id,
        invited: guestRow.invited,
        partySize: guestRow.party_size,
        notes: guestRow.notes,
        subEventIds: subEventIds ?? [],
        tagIds: tagIds ?? [],
        createdAt: guestRow.created_at,
      },
    }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
