import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const uuidSchema = z.string().uuid()

const postSchema = z.object({
  question:      z.string().min(1).max(300),
  answer:        z.string().min(1).max(2000),
  display_order: z.number().int().min(0).optional(),
}).strict()

async function verifyOwnership(supabase: Awaited<ReturnType<typeof createClient>>, eventId: string, userId: string) {
  const { data } = await supabase
    .from('events').select('id').eq('id', eventId).eq('user_id', userId).is('deleted_at', null).single()
  return !!data
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params
    if (!uuidSchema.safeParse(id).success) return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!await verifyOwnership(supabase, id, user.id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { data, error } = await supabase
      .from('event_qa_items')
      .select('id, question, answer, is_visible, display_order')
      .eq('event_id', id)
      .order('display_order')

    if (error) { console.error('GET qa-items failed:', error); return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 }) }
    return NextResponse.json({ items: data ?? [] })
  } catch { return NextResponse.json({ error: 'Internal server error' }, { status: 500 }) }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params
    if (!uuidSchema.safeParse(id).success) return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!await verifyOwnership(supabase, id, user.id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    let body: unknown
    try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

    const parsed = postSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })

    const { data, error } = await supabase
      .from('event_qa_items')
      .insert({ event_id: id, created_by: user.id, updated_by: user.id, ...parsed.data })
      .select('id, question, answer, is_visible, display_order')
      .single()

    if (error) { console.error('POST qa-items failed:', error); return NextResponse.json({ error: 'Failed to create' }, { status: 500 }) }
    return NextResponse.json({ item: data }, { status: 201 })
  } catch { return NextResponse.json({ error: 'Internal server error' }, { status: 500 }) }
}
