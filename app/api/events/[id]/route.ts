import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import type {
  EventTypeRow,
  EventMetadataRow,
  EventSubEventRow,
  EventWithDetails,
  EventSubEvent,
} from '@/lib/types/events'

const uuidSchema = z.string().uuid()

// --- DB row types for joined queries ---

interface EventDetailRow {
  id: string
  user_id: string
  event_type_id: string
  name: string | null
  primary_date: string | null
  primary_venue: string | null
  guest_capacity: number | null
  cover_image_url: string | null
  description: string | null
  status: string
  created_at: string
  updated_at: string
  event_types: Pick<EventTypeRow, 'id' | 'name' | 'slug' | 'icon_name' | 'has_sub_events'>
}

interface EventSubEventWithType extends EventSubEventRow {
  sub_event_types: {
    name: string
    icon_name: string | null
  } | null
}

// --- GET /api/events/[id] ---

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params

    const parsed = uuidSchema.safeParse(id)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid event ID — must be a valid UUID' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch event with event_type join
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select(`
        id,
        user_id,
        event_type_id,
        name,
        primary_date,
        primary_venue,
        guest_capacity,
        cover_image_url,
        description,
        status,
        created_at,
        updated_at,
        event_types ( id, name, slug, icon_name, has_sub_events )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (eventError || !eventData) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const event = eventData as unknown as EventDetailRow

    // Fetch metadata
    const { data: metadataRows, error: metaError } = await supabase
      .from('event_metadata')
      .select('id, event_id, key, value')
      .eq('event_id', id)

    if (metaError) {
      console.error('GET /api/events/[id] metadata error:', metaError)
      return NextResponse.json({ error: 'Failed to fetch event metadata' }, { status: 500 })
    }

    const metadata: Record<string, string> = {}
    for (const row of (metadataRows as EventMetadataRow[])) {
      metadata[row.key] = row.value ?? ''
    }

    // Fetch sub-events with sub_event_types join for names
    const { data: subEventRows, error: subEventError } = await supabase
      .from('event_sub_events')
      .select(`
        id,
        event_id,
        sub_event_type_id,
        custom_name,
        date,
        time,
        venue,
        status,
        display_order,
        created_at,
        updated_at,
        sub_event_types ( name, icon_name )
      `)
      .eq('event_id', id)
      .order('display_order', { ascending: true })

    if (subEventError) {
      console.error('GET /api/events/[id] sub-events error:', subEventError)
      return NextResponse.json({ error: 'Failed to fetch sub-events' }, { status: 500 })
    }

    const subEvents: EventSubEvent[] = (subEventRows as unknown as EventSubEventWithType[]).map((row) => ({
      id: row.id,
      name: row.custom_name ?? row.sub_event_types?.name ?? 'Unnamed',
      iconName: row.sub_event_types?.icon_name ?? null,
      date: row.date,
      time: row.time,
      venue: row.venue,
      status: row.status as EventSubEvent['status'],
    }))

    const et = event.event_types

    const response: EventWithDetails = {
      id: event.id,
      name: event.name,
      primaryDate: event.primary_date,
      primaryVenue: event.primary_venue,
      guestCapacity: event.guest_capacity,
      coverImageUrl: event.cover_image_url,
      description: event.description,
      status: event.status as EventWithDetails['status'],
      createdAt: event.created_at,
      updatedAt: event.updated_at,
      eventType: {
        id: et.id,
        name: et.name,
        slug: et.slug,
        iconName: et.icon_name,
        hasSubEvents: et.has_sub_events,
      },
      metadata,
      subEvents,
    }

    return NextResponse.json({ event: response })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
