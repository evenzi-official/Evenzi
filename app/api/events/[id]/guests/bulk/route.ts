import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { bulkActionSchema, uuidSchema } from '@/lib/validations/guests'

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

    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = bulkActionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    if (parsed.data.action === 'delete') {
      const { guestIds } = parsed.data
      const { error } = await supabase
        .from('event_guests')
        .delete()
        .eq('event_id', id)
        .in('id', guestIds)
      if (error) {
        console.error('POST /api/events/[id]/guests/bulk (delete) failed:', error)
        return NextResponse.json({ error: 'Failed to remove guests' }, { status: 500 })
      }
      return NextResponse.json({ success: true, count: guestIds.length })
    }

    if (parsed.data.action === 'tag') {
      const { guestIds, tagIds } = parsed.data
      // Union — adds tags without disturbing a guest's existing ones. The
      // unique constraint is (guest_id, tag_id), NOT (event_id, guest_id,
      // tag_id) — verified against the live schema during planning.
      const rows = guestIds.flatMap((guestId) => tagIds.map((tagId) => ({ event_id: id, guest_id: guestId, tag_id: tagId })))
      const { error } = await supabase
        .from('event_guest_tag_links')
        .upsert(rows, { onConflict: 'guest_id,tag_id', ignoreDuplicates: true })
      if (error) {
        console.error('POST /api/events/[id]/guests/bulk (tag) failed:', error)
        return NextResponse.json({ error: 'Failed to tag guests' }, { status: 500 })
      }
      return NextResponse.json({ success: true, count: guestIds.length })
    }

    // action === 'assign' — replaces each selected guest's functions.
    const { guestIds, subEventIds } = parsed.data
    const { error: delError } = await supabase
      .from('event_guest_sub_events')
      .delete()
      .eq('event_id', id)
      .in('guest_id', guestIds)
    if (delError) {
      console.error('POST /api/events/[id]/guests/bulk (assign, clear) failed:', delError)
      return NextResponse.json({ error: 'Failed to update functions' }, { status: 500 })
    }
    if (subEventIds.length > 0) {
      const rows = guestIds.flatMap((guestId) => subEventIds.map((subEventId) => ({ event_id: id, guest_id: guestId, sub_event_id: subEventId })))
      const { error: insError } = await supabase.from('event_guest_sub_events').insert(rows)
      if (insError) {
        console.error('POST /api/events/[id]/guests/bulk (assign, insert) failed:', insError)
        return NextResponse.json({ error: 'Failed to update functions' }, { status: 500 })
      }
    }
    return NextResponse.json({ success: true, count: guestIds.length })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
