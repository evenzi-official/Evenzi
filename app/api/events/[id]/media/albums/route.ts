import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createAlbumSchema, uuidSchema } from '@/lib/validations/media'
import { assertEventOwnership } from '@/lib/media/ownership'

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

    const owned = await assertEventOwnership(supabase, id, user.id)
    if (!owned) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = createAlbumSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { data: album, error: insertError } = await supabase
      .from('event_albums')
      .insert({ event_id: id, name: parsed.data.name, is_custom: true, created_by: user.id })
      .select('*')
      .single()

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ error: 'An album with this name already exists' }, { status: 409 })
      }
      console.error('POST /api/events/[id]/media/albums failed:', insertError)
      return NextResponse.json({ error: 'Failed to create album' }, { status: 500 })
    }

    return NextResponse.json(album, { status: 201 })
  } catch (err) {
    console.error('POST /api/events/[id]/media/albums failed:', err)
    return NextResponse.json({ error: 'Failed to create album' }, { status: 500 })
  }
}
