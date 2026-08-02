import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const patchSchema = z.object({ show_on_website: z.boolean() }).strict()

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; subId: string }> }
): Promise<NextResponse> {
  const { id, subId } = await params
  const supabase = await createClient()

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const { data: event } = await supabase
    .from('events')
    .select('id')
    .eq('id', id)
    .is('deleted_at', null)
    .single()
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  const { data, error } = await supabase
    .from('event_sub_events')
    .update({ show_on_website: parsed.data.show_on_website, updated_at: new Date().toISOString() })
    .eq('id', subId)
    .eq('event_id', id)
    .select('id, show_on_website')
    .single()

  if (error || !data) {
    console.error('PATCH /api/events/[id]/sub-events/[subId]:', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }

  return NextResponse.json(data)
}
