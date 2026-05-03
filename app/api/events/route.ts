import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createEventSchema } from '@/lib/validations/events'
import type { EventTypeRow, EventListItem } from '@/lib/types/events'

// --- Name generation helper ---

function generateEventName(
  eventSlug: string,
  eventTypeName: string,
  metadata: Record<string, string>
): string {
  const trim = (v: string | undefined) => (v ?? '').trim()

  if (eventSlug === 'wedding') {
    const p1 = trim(metadata['partner_1_name'])
    const p2 = trim(metadata['partner_2_name'])
    if (p1 && p2) return `${p1} & ${p2}'s Wedding`
    if (p1) return `${p1}'s Wedding`
    return 'My Wedding'
  }

  if (eventSlug === 'birthday') {
    const celebrant = trim(metadata['celebrant_name'])
    if (celebrant) return `${celebrant}'s Birthday`
    return 'My Birthday'
  }

  if (eventSlug === 'corporate') {
    const org = trim(metadata['organization_name'])
    if (org) return `${org} Event`
    return 'Corporate Event'
  }

  return `My ${eventTypeName}`
}

// --- DB row types for joined queries ---

interface EventListRow {
  id: string
  name: string | null
  primary_date: string | null
  primary_venue: string | null
  guest_capacity: number | null
  cover_image_url: string | null
  status: string
  created_at: string
  event_types: {
    name: string
    slug: string
    icon_name: string | null
  }
  event_sub_events: { count: number }[]
}

interface RpcResult {
  event_id: string
  event_name: string
  event_status: string
  created_at: string
}

// --- POST /api/events ---

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = createEventSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { eventTypeId, metadata, primaryDate, primaryVenue, guestCapacity, subEvents } = parsed.data

    // Verify event type exists and is enabled
    const { data: eventTypeData, error: typeError } = await supabase
      .from('event_types')
      .select('id, name, slug, enabled')
      .eq('id', eventTypeId)
      .single()

    if (typeError || !eventTypeData) {
      return NextResponse.json({ error: 'Event type not found' }, { status: 400 })
    }

    const eventType = eventTypeData as Pick<EventTypeRow, 'id' | 'name' | 'slug' | 'enabled'>

    if (!eventType.enabled) {
      return NextResponse.json({ error: 'Event type is not available' }, { status: 400 })
    }

    // Generate event name from metadata
    const eventName = generateEventName(eventType.slug, eventType.name, metadata)

    // Build RPC params
    const pMetadata = Object.entries(metadata).map(([key, value]) => ({ key, value }))
    const pSubEvents = subEvents.map((se, index) => ({
      sub_event_type_id: se.subEventTypeId ?? '',
      custom_name: se.customName ?? '',
      display_order: index + 1,
    }))

    const { data: rpcData, error: rpcError } = await supabase.rpc('create_event_with_details', {
      p_user_id: user.id,
      p_event_type_id: eventTypeId,
      p_name: eventName,
      p_primary_date: primaryDate ?? null,
      p_primary_venue: primaryVenue ?? null,
      p_guest_capacity: guestCapacity ?? null,
      p_metadata: pMetadata,
      p_sub_events: pSubEvents,
    })

    if (rpcError) {
      console.error('RPC create_event_with_details error:', rpcError)
      return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
    }

    const result = rpcData as RpcResult

    return NextResponse.json(
      {
        event: {
          id: result.event_id,
          name: result.event_name,
          status: result.event_status,
          createdAt: result.created_at,
        },
      },
      { status: 201 }
    )
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// --- GET /api/events ---

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('events')
      .select(`
        id,
        name,
        primary_date,
        primary_venue,
        guest_capacity,
        cover_image_url,
        status,
        created_at,
        event_types ( name, slug, icon_name ),
        event_sub_events ( count )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('GET /api/events error:', error)
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
    }

    const events: EventListItem[] = (data as unknown as EventListRow[]).map((row) => ({
      id: row.id,
      name: row.name,
      eventType: {
        name: row.event_types.name,
        slug: row.event_types.slug,
        iconName: row.event_types.icon_name,
      },
      primaryDate: row.primary_date,
      primaryVenue: row.primary_venue,
      guestCapacity: row.guest_capacity,
      coverImageUrl: row.cover_image_url,
      status: row.status,
      subEventCount: row.event_sub_events[0]?.count ?? 0,
      createdAt: row.created_at,
    }))

    return NextResponse.json({ events })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
