import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { assignAlbumsSchema, uuidSchema } from '@/lib/validations/media'
import { assertEventOwnership } from '@/lib/media/ownership'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; mediaId: string }> }
): Promise<NextResponse> {
  try {
    const { id, mediaId } = await params
    if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(mediaId).success) {
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

    const parsed = assignAlbumsSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const { mode, albumIds } = parsed.data

    if (mode === 'remove') {
      const { error: deleteError } = await supabase
        .from('event_media_albums')
        .delete()
        .eq('media_id', mediaId)
        .in('album_id', albumIds)
      if (deleteError) {
        console.error('PATCH [mediaId]/albums (remove) failed:', deleteError)
        return NextResponse.json({ error: 'Failed to unassign album' }, { status: 500 })
      }
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    // mode === 'add' — insert one row per album; a 23505 (already assigned) is a no-op success.
    const results = await Promise.all(
      albumIds.map((albumId) =>
        supabase.from('event_media_albums').insert({ event_id: id, media_id: mediaId, album_id: albumId })
      )
    )
    const hardFailure = results.find((r) => r.error && r.error.code !== '23505')
    if (hardFailure) {
      console.error('PATCH [mediaId]/albums (add) failed:', hardFailure.error)
      return NextResponse.json({ error: 'Failed to assign album' }, { status: 500 })
    }

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (err) {
    console.error('PATCH /api/events/[id]/media/[mediaId]/albums failed:', err)
    return NextResponse.json({ error: 'Failed to update album assignment' }, { status: 500 })
  }
}
