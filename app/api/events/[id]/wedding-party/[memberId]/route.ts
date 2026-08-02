import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const uuidSchema = z.string().uuid()

const patchSchema = z.object({
  name:          z.string().min(1).max(100).optional(),
  side:          z.enum(['bride', 'groom', 'neutral']).optional(),
  relation:      z.string().max(100).nullable().optional(),
  photo_key:     z.string().max(512).nullable().optional(),
  is_visible:    z.boolean().optional(),
  display_order: z.number().int().min(0).optional(),
}).strict()

async function verifyOwnership(supabase: Awaited<ReturnType<typeof createClient>>, eventId: string, userId: string) {
  const { data } = await supabase
    .from('events').select('id').eq('id', eventId).eq('user_id', userId).is('deleted_at', null).single()
  return !!data
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
): Promise<NextResponse> {
  try {
    const { id, memberId } = await params
    if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(memberId).success) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!await verifyOwnership(supabase, id, user.id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    let body: unknown
    try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    if (Object.keys(parsed.data).length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 })

    const { data, error } = await supabase
      .from('event_wedding_party_members')
      .update({ ...parsed.data, updated_by: user.id, updated_at: new Date().toISOString() })
      .eq('id', memberId).eq('event_id', id)
      .select('id, name, side, relation, photo_key, is_visible, display_order')
      .single()

    if (error) { console.error('PATCH wedding-party/[memberId] failed:', error); return NextResponse.json({ error: 'Failed to update' }, { status: 500 }) }
    if (!data) return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    return NextResponse.json({ member: data })
  } catch { return NextResponse.json({ error: 'Internal server error' }, { status: 500 }) }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
): Promise<NextResponse> {
  try {
    const { id, memberId } = await params
    if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(memberId).success) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!await verifyOwnership(supabase, id, user.id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { error } = await supabase
      .from('event_wedding_party_members')
      .delete().eq('id', memberId).eq('event_id', id)

    if (error) { console.error('DELETE wedding-party/[memberId] failed:', error); return NextResponse.json({ error: 'Failed to delete' }, { status: 500 }) }
    return NextResponse.json({ success: true })
  } catch { return NextResponse.json({ error: 'Internal server error' }, { status: 500 }) }
}
