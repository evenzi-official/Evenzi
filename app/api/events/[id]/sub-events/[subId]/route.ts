import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireEventWrite } from '@/lib/auth/eventAccess'
import { z } from 'zod'

const uuidSchema = z.string().uuid()

const dateField = z.preprocess(
  (v) => (v === '' ? null : v),
  z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.null()]),
)
const timeField = z.preprocess(
  (v) => (v === '' ? null : v),
  z.union([z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/), z.null()]),
)
const venueField = z.preprocess(
  (v) => (v === '' ? null : v),
  z.union([z.string().max(200), z.null()]),
)

const patchSchema = z
  .object({
    show_on_website: z.boolean().optional(),
    custom_name: z.string().trim().min(1).max(120).optional(),
    event_sub_type_id: z.preprocess(
      (v) => (v === '' ? null : v),
      z.union([z.string().uuid(), z.null()]).optional(),
    ),
    event_date: dateField.optional(),
    start_time: timeField.optional(),
    venue: venueField.optional(),
  })
  .strict()
  .refine((d) => Object.keys(d).length > 0, { message: 'No fields to update' })

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; subId: string }> },
): Promise<NextResponse> {
  try {
    const { id, subId } = await params
    if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(subId).success) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const patch = parsed.data
    const onlyWebsite =
      patch.show_on_website !== undefined &&
      patch.custom_name === undefined &&
      patch.event_sub_type_id === undefined &&
      patch.event_date === undefined &&
      patch.start_time === undefined &&
      patch.venue === undefined

    const capability = onlyWebsite ? 'website' : 'general'
    const access = await requireEventWrite(supabase, id, user.id, capability)
    if (!access.ok) return access.response

    if (patch.event_sub_type_id) {
      const { data: typeRow } = await supabase
        .schema('config')
        .from('event_sub_types')
        .select('id')
        .eq('id', patch.event_sub_type_id)
        .maybeSingle()
      if (!typeRow) {
        return NextResponse.json({ error: 'Unknown sub-event type' }, { status: 400 })
      }
    }

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (patch.show_on_website !== undefined) update.show_on_website = patch.show_on_website
    if (patch.custom_name !== undefined) update.custom_name = patch.custom_name
    if (patch.event_sub_type_id !== undefined) update.event_sub_type_id = patch.event_sub_type_id
    if (patch.event_date !== undefined) update.event_date = patch.event_date
    if (patch.start_time !== undefined) update.start_time = patch.start_time
    if (patch.venue !== undefined) update.venue = patch.venue

    const { data, error } = await supabase
      .from('event_sub_events')
      .update(update)
      .eq('id', subId)
      .eq('event_id', id)
      .select(
        'id, custom_name, event_sub_type_id, event_date, start_time, venue, show_on_website, display_order, status',
      )
      .single()

    if (error || !data) {
      console.error('PATCH /api/events/[id]/sub-events/[subId]:', error)
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; subId: string }> },
): Promise<NextResponse> {
  try {
    const { id, subId } = await params
    if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(subId).success) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const access = await requireEventWrite(supabase, id, user.id, 'general')
    if (!access.ok) return access.response

    const { error: unlinkError } = await supabase
      .from('event_guest_sub_events')
      .delete()
      .eq('event_id', id)
      .eq('sub_event_id', subId)

    if (unlinkError) {
      console.error('DELETE sub-event guest unlink:', unlinkError)
      return NextResponse.json(
        { error: 'This function is linked to guests and could not be removed' },
        { status: 409 },
      )
    }

    const { data, error } = await supabase
      .from('event_sub_events')
      .delete()
      .eq('id', subId)
      .eq('event_id', id)
      .select('id')
      .maybeSingle()

    if (error) {
      console.error('DELETE /api/events/[id]/sub-events/[subId]:', error)
      return NextResponse.json(
        { error: 'This function is still in use and could not be removed' },
        { status: 409 },
      )
    }
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
