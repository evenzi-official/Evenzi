import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const uuidSchema = z.string().uuid()

const rsvpSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
  phone: z.string().regex(/^\d{10}$/, 'Enter a valid 10-digit mobile number'),
  attendance: z.enum(['yes', 'no', 'maybe']),
}).strict()

const ATTENDANCE_TO_SLUG: Record<string, string> = {
  yes: 'confirmed',
  no: 'declined',
  maybe: 'maybe',
}

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase service role env vars')
  return createSupabaseClient(url, key, { auth: { persistSession: false } })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
    }

    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = rsvpSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { name, phone, attendance } = parsed.data
    const statusSlug = ATTENDANCE_TO_SLUG[attendance]

    let supabase: ReturnType<typeof createServiceClient>
    try {
      supabase = createServiceClient()
    } catch {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }

    // Verify the event exists and isn't deleted
    const { data: eventRow, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (eventError || !eventRow) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Resolve the rsvp_status_id for the chosen attendance slug
    const { data: statusRow, error: statusError } = await supabase
      .schema('config')
      .from('rsvp_statuses')
      .select('id')
      .eq('slug', statusSlug)
      .single()

    if (statusError || !statusRow) {
      console.error('POST /api/events/[id]/rsvp: status lookup failed:', statusError)
      return NextResponse.json({ error: 'Failed to process RSVP' }, { status: 500 })
    }

    const { data: guestRow, error: insertError } = await supabase
      .from('event_guests')
      .insert({
        event_id: id,
        name,
        phone,
        rsvp_status_id: statusRow.id,
        invited: false,
        party_size: 1,
      })
      .select('id, name')
      .single()

    if (insertError || !guestRow) {
      console.error('POST /api/events/[id]/rsvp: insert failed:', insertError)
      return NextResponse.json({ error: 'Failed to save RSVP' }, { status: 500 })
    }

    return NextResponse.json({ success: true, guestId: guestRow.id }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
