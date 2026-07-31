import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { uuidSchema } from '@/lib/validations/media'
import { assertEventOwnership } from '@/lib/media/ownership'
import { deleteObject, R2_BUCKET_PRIVATE } from '@/lib/storage/r2'

export async function DELETE(
  _request: Request,
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

    const { data: row } = await supabase
      .from('event_media')
      .select('storage_key, thumbnail_key')
      .eq('event_id', id)
      .eq('id', mediaId)
      .single()

    if (!row) return NextResponse.json({ error: 'Media not found' }, { status: 404 })

    // DB row deleted first (source of truth for the UI); R2 purge is best-effort after.
    const { error: deleteError } = await supabase.from('event_media').delete().eq('id', mediaId)
    if (deleteError) {
      console.error('DELETE /api/events/[id]/media/[mediaId] db delete failed:', deleteError)
      return NextResponse.json({ error: 'Failed to delete media' }, { status: 500 })
    }

    await Promise.all([
      deleteObject(R2_BUCKET_PRIVATE, row.storage_key).catch((e) => console.error('R2 delete failed (orphan):', e)),
      deleteObject(R2_BUCKET_PRIVATE, row.thumbnail_key).catch((e) => console.error('R2 delete failed (orphan):', e)),
    ])

    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error('DELETE /api/events/[id]/media/[mediaId] failed:', err)
    return NextResponse.json({ error: 'Failed to delete media' }, { status: 500 })
  }
}
