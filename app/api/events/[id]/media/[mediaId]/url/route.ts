import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { uuidSchema } from '@/lib/validations/media'
import { assertEventOwnership } from '@/lib/media/ownership'
import { getSignedDownloadUrl, R2_BUCKET_PRIVATE } from '@/lib/storage/r2'

const SIGNED_URL_EXPIRES_IN = 3600

export async function GET(
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
      .select('storage_key')
      .eq('event_id', id)
      .eq('id', mediaId)
      .single()

    if (!row) return NextResponse.json({ error: 'Media not found' }, { status: 404 })

    const url = await getSignedDownloadUrl(row.storage_key, {
      bucket: R2_BUCKET_PRIVATE,
      expiresIn: SIGNED_URL_EXPIRES_IN,
    })

    return NextResponse.json({ url, expiresAt: Date.now() + SIGNED_URL_EXPIRES_IN * 1000 }, { status: 200 })
  } catch (err) {
    console.error('GET /api/events/[id]/media/[mediaId]/url failed:', err)
    return NextResponse.json({ error: 'Failed to sign URL' }, { status: 500 })
  }
}
