import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { requireEventWrite } from '@/lib/auth/eventAccess'
import { z } from 'zod'

const uuidSchema = z.string().uuid()

const patchSchema = z.object({
  name:          z.string().min(1).max(200).optional(),
  address:       z.string().max(500).nullable().optional(),
  phone:         z.string().max(20).nullable().optional(),
  price_band:    z.enum(['budget', 'mid', 'luxury']).nullable().optional(),
  distance_text: z.string().max(100).nullable().optional(),
  map_link:      z.string().url().nullable().optional(),
  booking_url:   z.string().url().nullable().optional(),
  note:          z.string().max(500).nullable().optional(),
  display_order: z.number().int().min(0).optional(),
}).strict()


export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; stayId: string }> }
): Promise<NextResponse> {
  try {
    const { id, stayId } = await params
    if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(stayId).success) {
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
      .from('event_stays')
      .update({ ...parsed.data, updated_by: user.id, updated_at: new Date().toISOString() })
      .eq('id', stayId).eq('event_id', id)
      .select('id, name, address, phone, price_band, distance_text, map_link, booking_url, note, display_order')
      .single()

    if (error) { console.error('PATCH stays/[stayId] failed:', error); return NextResponse.json({ error: 'Failed to update' }, { status: 500 }) }
    if (!data) return NextResponse.json({ error: 'Stay not found' }, { status: 404 })
    return NextResponse.json({ stay: data })
  } catch { return NextResponse.json({ error: 'Internal server error' }, { status: 500 }) }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; stayId: string }> }
): Promise<NextResponse> {
  try {
    const { id, stayId } = await params
    if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(stayId).success) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const access = await requireEventWrite(supabase, id, user.id, 'website')
    if (!access.ok) return access.response

    const { error } = await supabase
      .from('event_stays')
      .delete().eq('id', stayId).eq('event_id', id)

    if (error) { console.error('DELETE stays/[stayId] failed:', error); return NextResponse.json({ error: 'Failed to delete' }, { status: 500 }) }
    return NextResponse.json({ success: true })
  } catch { return NextResponse.json({ error: 'Internal server error' }, { status: 500 }) }
}
