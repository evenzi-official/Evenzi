import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createTagSchema, uuidSchema } from '@/lib/validations/guests'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = createTagSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { data: tagRow, error } = await supabase
      .from('event_guest_tags')
      .insert({ event_id: id, name: parsed.data.name, is_custom: true, created_by: user.id })
      .select('id, name, is_custom')
      .single()

    if (error || !tagRow) {
      console.error('POST /api/events/[id]/guest-tags failed:', error)
      return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 })
    }

    return NextResponse.json({ tag: { id: tagRow.id, name: tagRow.name, isCustom: tagRow.is_custom } }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
