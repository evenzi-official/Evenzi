import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { renameAlbumSchema, uuidSchema } from '@/lib/validations/media'
import { assertEventOwnership } from '@/lib/media/ownership'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; albumId: string }> }
): Promise<NextResponse> {
  try {
    const { id, albumId } = await params
    if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(albumId).success) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
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

    const parsed = renameAlbumSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { data: album, error: updateError } = await supabase
      .from('event_albums')
      .update({ name: parsed.data.name })
      .eq('id', albumId)
      .eq('event_id', id)
      .select('*')
      .single()

    if (updateError) {
      if (updateError.code === '23505') {
        return NextResponse.json({ error: 'An album with this name already exists' }, { status: 409 })
      }
      console.error('PATCH /api/events/[id]/media/albums/[albumId] failed:', updateError)
      return NextResponse.json({ error: 'Failed to rename album' }, { status: 500 })
    }

    return NextResponse.json(album, { status: 200 })
  } catch (err) {
    console.error('PATCH /api/events/[id]/media/albums/[albumId] failed:', err)
    return NextResponse.json({ error: 'Failed to rename album' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; albumId: string }> }
): Promise<NextResponse> {
  try {
    const { id, albumId } = await params
    if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(albumId).success) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const owned = await assertEventOwnership(supabase, id, user.id)
    if (!owned) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    // Links-only delete (D32) — event_media_albums cascades on FK, media rows survive.
    const { error: deleteError } = await supabase.from('event_albums').delete().eq('id', albumId).eq('event_id', id)
    if (deleteError) {
      console.error('DELETE /api/events/[id]/media/albums/[albumId] failed:', deleteError)
      return NextResponse.json({ error: 'Failed to delete album' }, { status: 500 })
    }

    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error('DELETE /api/events/[id]/media/albums/[albumId] failed:', err)
    return NextResponse.json({ error: 'Failed to delete album' }, { status: 500 })
  }
}
