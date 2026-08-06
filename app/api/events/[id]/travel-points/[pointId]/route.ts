import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { requireEventWrite } from '@/lib/auth/eventAccess'
import { z } from 'zod'

const uuidSchema = z.string().uuid()

const patchSchema = z.object({
  kind:             z.enum(['airport', 'railway', 'bus', 'road', 'other']).optional(),
  name:             z.string().min(1).max(200).optional(),
  distance_text:    z.string().max(100).nullable().optional(),
  travel_time_text: z.string().max(100).nullable().optional(),
  map_link:         z.string().url().nullable().optional(),
  note:             z.string().max(500).nullable().optional(),
  display_order:    z.number().int().min(0).optional(),
}).strict()


export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; pointId: string }> }
): Promise<NextResponse> {
  try {
    const { id, pointId } = await params
    if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(pointId).success) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const access = await requireEventWrite(supabase, id, user.id, 'website')
    if (!access.ok) return access.response

    let body: unknown
    try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    if (Object.keys(parsed.data).length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 })

    const { data, error } = await supabase
      .from('event_travel_points')
      .update({ ...parsed.data, updated_by: user.id, updated_at: new Date().toISOString() })
      .eq('id', pointId).eq('event_id', id)
      .select('id, kind, name, distance_text, travel_time_text, map_link, note, display_order')
      .single()

    if (error) { console.error('PATCH travel-points/[pointId] failed:', error); return NextResponse.json({ error: 'Failed to update' }, { status: 500 }) }
    if (!data) return NextResponse.json({ error: 'Point not found' }, { status: 404 })
    return NextResponse.json({ point: data })
  } catch { return NextResponse.json({ error: 'Internal server error' }, { status: 500 }) }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; pointId: string }> }
): Promise<NextResponse> {
  try {
    const { id, pointId } = await params
    if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(pointId).success) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const access = await requireEventWrite(supabase, id, user.id, 'website')
    if (!access.ok) return access.response

    const { error } = await supabase
      .from('event_travel_points')
      .delete().eq('id', pointId).eq('event_id', id)

    if (error) { console.error('DELETE travel-points/[pointId] failed:', error); return NextResponse.json({ error: 'Failed to delete' }, { status: 500 }) }
    return NextResponse.json({ success: true })
  } catch { return NextResponse.json({ error: 'Internal server error' }, { status: 500 }) }
}
