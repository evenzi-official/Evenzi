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
  event_type_id: string
  primary_date: string | null
  primary_venue: string | null
  guest_capacity: number | null
  cover_image_url: string | null
  status: string
  created_at: string
  event_sub_events: { count: number }[]
}

// config.event_types catalog row (resolved via direct config-schema query, NOT an embed)
interface EventTypeListRow {
  id: string
  name: string
  slug: string
  icon_name: string | null
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

    const { eventTypeId, metadata, primaryDate, primaryVenue, guestCapacity, subEvents, coverImageUrl } = parsed.data

    // Verify event type exists and is enabled
    const { data: eventTypeData, error: typeError } = await supabase
      .schema('config')
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
      sub_event_type_id: se.subEventTypeId ?? null,
      custom_name: se.customName ?? null,
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

    // Save cover image URL if provided
    if (coverImageUrl) {
      const { error: coverError } = await supabase
        .from('events')
        .update({ cover_image_url: coverImageUrl })
        .eq('id', result.event_id)
      if (coverError) {
        console.error('Failed to save cover image URL:', coverError)
      }
    }

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

    // event_types lives in the `config` schema. PostgREST embeds only resolve within
    // `public`, so we do NOT embed it (a cross-schema embed fails with PGRST200 and was
    // silently nulling the type label). We fetch the event rows from public here, then
    // resolve the type names from config below and join in JS.
    const { data, error } = await supabase
      .from('events')
      .select(`
        id,
        name,
        event_type_id,
        primary_date,
        primary_venue,
        guest_capacity,
        cover_image_url,
        status,
        created_at,
        event_sub_events ( count )
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('GET /api/events error:', error)
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
    }

    const rows = (data as unknown as EventListRow[]) ?? []

    // Resolve event types from the config schema (direct query, NOT an embed)
    const eventTypeIds = Array.from(
      new Set(rows.map((row) => row.event_type_id).filter((v): v is string => v != null))
    )

    const typesById = new Map<string, EventTypeListRow>()
    if (eventTypeIds.length > 0) {
      const { data: typeRows, error: typeError } = await supabase
        .schema('config')
        .from('event_types')
        .select('id, name, slug, icon_name')
        .in('id', eventTypeIds)

      if (typeError) {
        console.error('GET /api/events event_types query failed:', typeError)
        return NextResponse.json({ error: 'Failed to fetch event types' }, { status: 500 })
      }

      for (const t of (typeRows ?? []) as EventTypeListRow[]) {
        typesById.set(t.id, t)
      }
    }

    const events: EventListItem[] = rows.map((row) => {
      const type = typesById.get(row.event_type_id)
      return {
        id: row.id,
        name: row.name,
        eventType: {
          name: type?.name ?? 'Event',
          slug: type?.slug ?? '',
          iconName: type?.icon_name ?? null,
        },
        primaryDate: row.primary_date,
        primaryVenue: row.primary_venue,
        guestCapacity: row.guest_capacity,
        coverImageUrl: row.cover_image_url,
        status: row.status,
        subEventCount: row.event_sub_events[0]?.count ?? 0,
        createdAt: row.created_at,
      }
    })

    return NextResponse.json({ events })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
