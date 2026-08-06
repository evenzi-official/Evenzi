import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireEventWrite } from '@/lib/auth/eventAccess'
import type {
  EventTypeRow,
  EventSubEventRow,
  EventWithDetails,
  EventSubEvent,
} from '@/lib/types/events'

const uuidSchema = z.string().uuid()

// --- PUT (edit) body schema ---
// All fields optional (partial edit). event_details is a partial shallow-merge of the
// jsonb bag (partner names etc.). Empty strings are coerced to null before writing,
// consistent with the D44 empty-string rule.
const updateEventSchema = z
  .object({
    name: z.string().max(500).nullable().optional(),
    primary_date: z.string().nullable().optional(),
    primary_venue: z.string().max(500).nullable().optional(),
    guest_capacity: z.coerce.number().int().positive().max(100000).nullable().optional(),
    event_details: z.record(z.string(), z.string().nullable()).optional(),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).min(3).max(80).optional(),
  })
  .strict()

// Coerce '' (and whitespace-only) → null for scalar string fields
function emptyToNull(value: string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null
  return value.trim() === '' ? null : value
}

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
}

// config.event_sub_types catalog row (resolved via direct config-schema query, NOT a cross-schema embed)
interface SubTypeRow {
  id: string
  name: string
  icon_name: string | null
}

// config.event_types catalog row (resolved via direct config-schema query, NOT a cross-schema embed)
type EventTypeCatalogRow = Pick<EventTypeRow, 'id' | 'name' | 'slug' | 'icon_name'>

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

    // Fetch the event from public. event_types/event_sub_types live in the `config`
    // schema, so we do NOT embed them here — PostgREST embeds only resolve within
    // `public` and a cross-schema embed fails with PGRST200. We resolve the catalog
    // rows via direct `.schema('config')` queries below and join in JS.
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
        updated_at
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (eventError) {
      // PGRST116 = no rows (single() found nothing) → genuine not-found.
      if (eventError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 })
      }
      console.error('GET /api/events/[id] event query failed:', eventError)
      return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 })
    }

    if (!eventData) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const event = eventData as EventDetailRow

    // Partner names and other variable fields live in events.event_details (jsonb)
    const metadata = (event.event_details ?? {}) as Record<string, string>

    // Resolve the event type from the config schema (direct query, NOT an embed)
    const { data: eventTypeData, error: eventTypeError } = await supabase
      .schema('config')
      .from('event_types')
      .select('id, name, slug, icon_name')
      .eq('id', event.event_type_id)
      .single()

    if (eventTypeError) {
      console.error('GET /api/events/[id] event_type query failed:', eventTypeError)
      return NextResponse.json({ error: 'Failed to fetch event type' }, { status: 500 })
    }

    const et = eventTypeData as EventTypeCatalogRow

    // Fetch sub-events from public (no embed)
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
        updated_at
      `)
      .eq('event_id', id)
      .order('display_order', { ascending: true })

    if (subEventError) {
      console.error('GET /api/events/[id] sub-events query failed:', subEventError)
      return NextResponse.json({ error: 'Failed to fetch sub-events' }, { status: 500 })
    }

    const subEventRowsTyped = (subEventRows ?? []) as EventSubEventRow[]

    // Resolve sub-event type names/icons from the config schema (direct query, NOT an embed)
    const subTypeIds = Array.from(
      new Set(
        subEventRowsTyped
          .map((row) => row.event_sub_type_id)
          .filter((v): v is string => v != null)
      )
    )

    const subTypesById = new Map<string, SubTypeRow>()
    if (subTypeIds.length > 0) {
      const { data: subTypeRows, error: subTypeError } = await supabase
        .schema('config')
        .from('event_sub_types')
        .select('id, name, icon_name')
        .in('id', subTypeIds)

      if (subTypeError) {
        console.error('GET /api/events/[id] event_sub_types query failed:', subTypeError)
        return NextResponse.json({ error: 'Failed to fetch sub-event types' }, { status: 500 })
      }

      for (const row of (subTypeRows ?? []) as SubTypeRow[]) {
        subTypesById.set(row.id, row)
      }
    }

    const subEvents: EventSubEvent[] = subEventRowsTyped.map((row) => {
      const subType = row.event_sub_type_id ? subTypesById.get(row.event_sub_type_id) : undefined
      return {
        id: row.id,
        name: row.custom_name ?? subType?.name ?? 'Unnamed',
        iconName: subType?.icon_name ?? null,
        date: row.event_date,
        time: row.start_time,
        venue: row.venue,
        status: row.status as EventSubEvent['status'],
      }
    })

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

// --- PUT /api/events/[id] (edit core details) ---

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params

    const parsedId = uuidSchema.safeParse(id)
    if (!parsedId.success) {
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

    const writeAccess = await requireEventWrite(supabase, id, user.id, 'general')
    if (!writeAccess.ok) return writeAccess.response

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = updateEventSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { name, primary_date, primary_venue, guest_capacity, event_details, slug } = parsed.data

    // Build the update patch — only include provided fields, coercing '' → null.
    const updates: Record<string, unknown> = {}
    if (name !== undefined) updates.name = emptyToNull(name)
    if (primary_date !== undefined) updates.primary_date = emptyToNull(primary_date)
    if (primary_venue !== undefined) updates.primary_venue = emptyToNull(primary_venue)
    if (guest_capacity !== undefined) updates.guest_capacity = guest_capacity ?? null
    if (slug !== undefined) updates.slug = slug

    // event_details is a partial shallow-merge of the existing jsonb bag.
    if (event_details !== undefined) {
      const { data: currentRow, error: currentError } = await supabase
        .from('events')
        .select('event_details')
        .eq('id', id)
        .is('deleted_at', null)
        .single()

      if (currentError) {
        if (currentError.code === 'PGRST116') {
          return NextResponse.json({ error: 'Event not found' }, { status: 404 })
        }
        console.error('PUT /api/events/[id] read-current event_details failed:', currentError)
        return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
      }

      const current = (currentRow?.event_details ?? {}) as Record<string, unknown>
      const merged: Record<string, unknown> = { ...current }
      for (const [key, value] of Object.entries(event_details)) {
        merged[key] = emptyToNull(value)
      }
      updates.event_details = merged
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { data: updatedData, error: updateError } = await supabase
      .from('events')
      .update(updates)
      .eq('id', id)
      .is('deleted_at', null)
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
        updated_at
      `)
      .single()

    if (updateError) {
      // No row matched (not found, soft-deleted, or RLS-hidden non-owned row).
      if (updateError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 })
      }
      if (updateError.code === '23505') {
        return NextResponse.json({ error: 'That URL is taken' }, { status: 409 })
      }
      console.error('PUT /api/events/[id] update failed:', updateError)
      return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
    }

    if (!updatedData) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const event = updatedData as EventDetailRow

    return NextResponse.json({
      event: {
        id: event.id,
        name: event.name,
        primaryDate: event.primary_date,
        primaryVenue: event.primary_venue,
        guestCapacity: event.guest_capacity,
        coverImageUrl: event.cover_image_url,
        description: event.description,
        status: event.status,
        createdAt: event.created_at,
        updatedAt: event.updated_at,
        metadata: (event.event_details ?? {}) as Record<string, string>,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// --- DELETE /api/events/[id] (soft delete) ---

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params

    const parsedId = uuidSchema.safeParse(id)
    if (!parsedId.success) {
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

    const writeAccess = await requireEventWrite(supabase, id, user.id, 'delete')
    if (!writeAccess.ok) return writeAccess.response

    // Soft delete: set deleted_at. The `.is('deleted_at', null)` filter makes a second
    // delete return no row → 404. RLS + requireEventWrite keep delete owner-only.
    const { data: deletedRow, error: deleteError } = await supabase
      .from('events')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .is('deleted_at', null)
      .select('id')
      .single()

    if (deleteError) {
      if (deleteError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 })
      }
      console.error('DELETE /api/events/[id] failed:', deleteError)
      return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
    }

    if (!deletedRow) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
