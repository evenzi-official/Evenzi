import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import type {
  EventTypeRow,
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
  event_details: Record<string, unknown>
  status: string
  created_at: string
  updated_at: string
  event_types: Pick<EventTypeRow, 'id' | 'name' | 'slug' | 'icon_name'>
}

interface EventSubEventWithType extends EventSubEventRow {
  event_sub_types: {
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

    // Fetch event with event_type join — event_details replaces the old event_metadata table
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
        event_details,
        status,
        created_at,
        updated_at,
        event_types ( id, name, slug, icon_name )
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (eventError || !eventData) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const event = eventData as unknown as EventDetailRow

    // Partner names and other variable fields live in events.event_details (jsonb)
    const metadata = (event.event_details ?? {}) as Record<string, string>

    // Fetch sub-events with event_sub_types join for names
    const { data: subEventRows, error: subEventError } = await supabase
      .from('event_sub_events')
      .select(`
        id,
        event_id,
        event_sub_type_id,
        custom_name,
        event_date,
        start_time,
        end_time,
        venue,
        status,
        display_order,
        created_at,
        updated_at,
        event_sub_types ( name, icon_name )
      `)
      .eq('event_id', id)
      .order('display_order', { ascending: true })

    if (subEventError) {
      console.error('GET /api/events/[id] sub-events error:', subEventError)
      return NextResponse.json({ error: 'Failed to fetch sub-events' }, { status: 500 })
    }

    const subEvents: EventSubEvent[] = (subEventRows as unknown as EventSubEventWithType[]).map((row) => ({
      id: row.id,
      name: row.custom_name ?? row.event_sub_types?.name ?? 'Unnamed',
      iconName: row.event_sub_types?.icon_name ?? null,
      date: row.event_date,
      time: row.start_time,
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
        hasSubEvents: true, // has_sub_events removed from schema; supported for all enabled types
      },
      metadata,
      subEvents,
    }

    return NextResponse.json({ event: response })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
