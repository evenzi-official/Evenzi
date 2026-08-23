import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireEventWrite } from '@/lib/auth/eventAccess'
import { z } from 'zod'

const uuidSchema = z.string().uuid()

const dateField = z.preprocess(
  (v) => (v === '' ? null : v),
  z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.null()]).optional(),
)
const timeField = z.preprocess(
  (v) => (v === '' ? null : v),
  z.union([z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/), z.null()]).optional(),
)

const postSchema = z
  .object({
    custom_name: z.string().trim().min(1).max(120).optional(),
    event_sub_type_id: z.preprocess(
      (v) => (v === '' ? null : v),
      z.union([z.string().uuid(), z.null()]).optional(),
    ),
    event_date: dateField,
    start_time: timeField,
    venue: z.preprocess(
      (v) => (v === '' ? null : v),
      z.union([z.string().max(200), z.null()]).optional(),
    ),
    show_on_website: z.boolean().optional(),
  })
  .strict()
  .refine((d) => Boolean(d.custom_name) || Boolean(d.event_sub_type_id), {
    message: 'custom_name or event_sub_type_id is required',
  })

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const access = await requireEventWrite(supabase, id, user.id, 'general')
    if (!access.ok) return access.response

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const parsed = postSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const payload = parsed.data

    if (payload.event_sub_type_id) {
      const { data: typeRow } = await supabase
        .schema('config')
        .from('event_sub_types')
        .select('id')
        .eq('id', payload.event_sub_type_id)
        .maybeSingle()
      if (!typeRow) {
        return NextResponse.json({ error: 'Unknown sub-event type' }, { status: 400 })
      }
    }

    const { data: last } = await supabase
      .from('event_sub_events')
      .select('display_order')
      .eq('event_id', id)
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle()

    const displayOrder = (last?.display_order ?? 0) + 1

    const { data, error } = await supabase
      .from('event_sub_events')
      .insert({
        event_id: id,
        custom_name: payload.custom_name ?? null,
        event_sub_type_id: payload.event_sub_type_id ?? null,
        event_date: payload.event_date ?? null,
        start_time: payload.start_time ?? null,
        venue: payload.venue ?? null,
        show_on_website: payload.show_on_website ?? true,
        display_order: displayOrder,
        status: 'tbc',
      })
      .select(
        'id, custom_name, event_sub_type_id, event_date, start_time, venue, show_on_website, display_order, status',
      )
      .single()

    if (error || !data) {
      console.error('POST /api/events/[id]/sub-events:', error)
      return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
