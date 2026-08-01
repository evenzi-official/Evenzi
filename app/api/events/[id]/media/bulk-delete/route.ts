import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { bulkDeleteSchema, uuidSchema } from '@/lib/validations/media'
import { assertEventOwnership } from '@/lib/media/ownership'
import { deleteObject, R2_BUCKET_PRIVATE } from '@/lib/storage/r2'

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

    const parsed = bulkDeleteSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const { ids } = parsed.data

    // Every id must resolve to a row scoped to THIS event — ids that don't
    // (wrong event, or don't exist) are reported failed, never silently
    // dropped or acted on.
    const { data: rows } = await supabase
      .from('event_media')
      .select('id, storage_key, thumbnail_key')
      .eq('event_id', id)
      .in('id', ids)

    const foundIds = new Set((rows ?? []).map((r: { id: string }) => r.id))
    const failed: { id: string; reason: string }[] = ids
      .filter((mediaId) => !foundIds.has(mediaId))
      .map((mediaId) => ({ id: mediaId, reason: 'not found' }))

    if (!rows || rows.length === 0) {
      return NextResponse.json({ deleted: [], failed }, { status: 200 })
    }

    const idsToDelete = rows.map((r: { id: string }) => r.id)

    // DB rows deleted first (source of truth for the UI), then best-effort R2 purge.
    const { error: deleteError } = await supabase.from('event_media').delete().in('id', idsToDelete)
    if (deleteError) {
      console.error('POST /api/events/[id]/media/bulk-delete db delete failed:', deleteError)
      return NextResponse.json({ error: 'Failed to delete media' }, { status: 500 })
    }

    await Promise.all(
      rows.flatMap((row: { storage_key: string; thumbnail_key: string }) => [
        deleteObject(R2_BUCKET_PRIVATE, row.storage_key).catch((e) => console.error('R2 delete failed (orphan):', e)),
        deleteObject(R2_BUCKET_PRIVATE, row.thumbnail_key).catch((e) => console.error('R2 delete failed (orphan):', e)),
      ])
    )

    return NextResponse.json({ deleted: idsToDelete, failed }, { status: 200 })
  } catch (err) {
    console.error('POST /api/events/[id]/media/bulk-delete failed:', err)
    return NextResponse.json({ error: 'Failed to bulk-delete media' }, { status: 500 })
  }
}
