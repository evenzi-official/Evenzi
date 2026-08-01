import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { commitMediaSchema, uuidSchema } from '@/lib/validations/media'
import { assertEventOwnership } from '@/lib/media/ownership'
import { headObject, getObjectRange, deleteObject, R2_BUCKET_PRIVATE } from '@/lib/storage/r2'
import { eventPrefix } from '@/lib/storage/keys'

const MAX_MASTER_BYTES = 20 * 1024 * 1024
const MAX_THUMB_BYTES = 2 * 1024 * 1024
const MAX_VIDEO_BYTES = 500 * 1024 * 1024

function checkMagicBytes(bytes: Buffer, contentType: string): boolean {
  if (contentType === 'image/webp') {
    return bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP'
  }
  if (contentType === 'image/jpeg') {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  }
  if (contentType === 'image/png') {
    return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
  }
  if (contentType === 'image/avif' || contentType === 'video/mp4' || contentType === 'video/quicktime') {
    return bytes.subarray(4, 8).toString() === 'ftyp'
  }
  return false
}

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

    const parsed = commitMediaSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const { kind, masterKey, thumbKey, contentType, width, height, durationSec } = parsed.data

    const prefix = eventPrefix(id)
    if (!masterKey.startsWith(prefix) || !thumbKey.startsWith(prefix)) {
      return NextResponse.json({ error: 'Storage key does not belong to this event' }, { status: 403 })
    }

    // Idempotency (best-effort — see spec §10 #7 for the residual race window)
    const { data: existing } = await supabase
      .from('event_media')
      .select('*')
      .eq('storage_key', masterKey)
      .single()
    if (existing) {
      return NextResponse.json(existing, { status: 200 })
    }

    async function rejectAndCleanup(status: number, error: string) {
      await Promise.all([
        deleteObject(R2_BUCKET_PRIVATE, masterKey).catch(() => {}),
        deleteObject(R2_BUCKET_PRIVATE, thumbKey).catch(() => {}),
      ])
      return NextResponse.json({ error }, { status })
    }

    const [masterHead, thumbHead] = await Promise.all([
      headObject({ bucket: R2_BUCKET_PRIVATE, key: masterKey }),
      headObject({ bucket: R2_BUCKET_PRIVATE, key: thumbKey }),
    ])

    if (!masterHead) return rejectAndCleanup(400, 'Master object was not found in storage')
    if (!thumbHead) return rejectAndCleanup(400, 'Thumbnail object was not found in storage')

    const masterCap = kind === 'video' ? MAX_VIDEO_BYTES : MAX_MASTER_BYTES
    if (masterHead.contentLength > masterCap) return rejectAndCleanup(413, 'File exceeds the size limit')
    if (thumbHead.contentLength > MAX_THUMB_BYTES) return rejectAndCleanup(413, 'Thumbnail exceeds the size limit')

    const magicBytes = await getObjectRange({ bucket: R2_BUCKET_PRIVATE, key: masterKey, start: 0, end: 15 })
    if (!checkMagicBytes(magicBytes, contentType)) {
      return rejectAndCleanup(400, 'File content does not match the declared type')
    }

    const { data: inserted, error: insertError } = await supabase
      .from('event_media')
      .insert({
        event_id: id,
        kind,
        storage_key: masterKey,
        thumbnail_key: thumbKey,
        content_type: contentType,
        byte_size: masterHead.contentLength,
        width,
        height,
        duration_sec: durationSec ?? null,
        created_by: user.id,
      })
      .select('*')
      .single()

    if (insertError || !inserted) {
      console.error('POST /api/events/[id]/media commit failed:', insertError)
      return NextResponse.json({ error: 'Failed to save media' }, { status: 500 })
    }

    return NextResponse.json(inserted, { status: 200 })
  } catch (err) {
    console.error('POST /api/events/[id]/media failed:', err)
    return NextResponse.json({ error: 'Failed to commit media' }, { status: 500 })
  }
}
