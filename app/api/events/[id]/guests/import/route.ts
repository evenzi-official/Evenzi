import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { requireEventWrite } from '@/lib/auth/eventAccess'
import { importGuestsSchema, uuidSchema } from '@/lib/validations/guests'

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

    const parsed = importGuestsSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { data: pendingStatus, error: statusError } = await supabase
      .schema('config')
      .from('rsvp_statuses')
      .select('id')
      .eq('slug', 'pending')
      .single()

    if (statusError || !pendingStatus) {
      console.error('POST /api/events/[id]/guests/import: pending status lookup failed:', statusError)
      return NextResponse.json({ error: 'Import failed' }, { status: 500 })
    }

    // Server-side dedupe re-check — the client already filtered duplicates
    // against the guest list it had, but that list can be stale by the time
    // the host clicks Import (design spec §5, step 6: "server re-validates").
    const { data: existing, error: existingError } = await supabase
      .from('event_guests')
      .select('phone')
      .eq('event_id', id)

    if (existingError) {
      console.error('POST /api/events/[id]/guests/import: existing lookup failed:', existingError)
      return NextResponse.json({ error: 'Import failed' }, { status: 500 })
    }

    const existingPhones = new Set((existing ?? []).map((g) => g.phone))
    const seen = new Set<string>()
    const toInsert = parsed.data.guests.filter((row) => {
      if (existingPhones.has(row.phone) || seen.has(row.phone)) return false
      seen.add(row.phone)
      return true
    })
    const skippedDuplicates = parsed.data.guests.length - toInsert.length

    if (toInsert.length === 0) {
      return NextResponse.json({ inserted: [], skippedDuplicates })
    }

    const { data: insertedRows, error: insertError } = await supabase
      .from('event_guests')
      .insert(toInsert.map((row) => ({
        event_id: id,
        name: row.name,
        phone: row.phone,
        email: row.email,
        rsvp_status_id: pendingStatus.id,
        invited: false,
        party_size: 1,
        created_by: user.id,
      })))
      .select('id, name, phone, email, rsvp_status_id, invited, party_size, notes, created_at')

    if (insertError || !insertedRows) {
      console.error('POST /api/events/[id]/guests/import: insert failed:', insertError)
      return NextResponse.json({ error: 'Import failed' }, { status: 500 })
    }

    return NextResponse.json({
      inserted: insertedRows.map((g) => ({
        id: g.id,
        name: g.name,
        phone: g.phone,
        email: g.email,
        rsvpStatusId: g.rsvp_status_id,
        invited: g.invited,
        partySize: g.party_size,
        notes: g.notes,
        subEventIds: [] as string[],
        tagIds: [] as string[],
        createdAt: g.created_at,
      })),
      skippedDuplicates,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
