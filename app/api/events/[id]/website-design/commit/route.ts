import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireEventWrite } from '@/lib/auth/eventAccess'
import {
  deleteObject,
  getObjectRange,
  getSignedDownloadUrl,
  headObject,
  R2_BUCKET_PUBLIC,
} from '@/lib/storage/r2'

const uuidSchema = z.string().uuid()
const bodySchema = z.object({
  purpose: z.enum(['cover', 'og']),
  key: z.string().min(1).max(512),
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
}).strict()

const MAX_BYTES = 12 * 1024 * 1024

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
  if (contentType === 'image/avif') {
    return bytes.subarray(4, 8).toString() === 'ftyp'
  }
  return false
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const access = await requireEventWrite(supabase, id, user.id, 'website')
    if (!access.ok) return access.response

    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { purpose, key, contentType } = parsed.data
    const prefix = `events/${id}/website/${purpose}/`
    if (!key.startsWith(prefix)) {
      return NextResponse.json({ error: 'Storage key does not belong to this event' }, { status: 403 })
    }

    const head = await headObject({ bucket: R2_BUCKET_PUBLIC, key })
    if (!head) return NextResponse.json({ error: 'Object was not found in storage' }, { status: 400 })
    if (head.contentLength > MAX_BYTES) {
      await deleteObject(R2_BUCKET_PUBLIC, key).catch(() => {})
      return NextResponse.json({ error: 'File exceeds the size limit' }, { status: 413 })
    }

    const magicBytes = await getObjectRange({ bucket: R2_BUCKET_PUBLIC, key, start: 0, end: 15 })
    if (!checkMagicBytes(magicBytes, contentType)) {
      await deleteObject(R2_BUCKET_PUBLIC, key).catch(() => {})
      return NextResponse.json({ error: 'File content does not match the declared type' }, { status: 400 })
    }

    const field = purpose === 'cover' ? 'cover_image_key' : 'og_image_key'
    const { error } = await supabase
      .from('event_website_design')
      .upsert({
        event_id: id,
        user_id: user.id,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
        [field]: key,
      }, { onConflict: 'event_id' })

    if (error) {
      console.error('POST /api/events/[id]/website-design/commit failed:', error)
      return NextResponse.json({ error: 'Failed to save design image' }, { status: 500 })
    }

    const previewUrl = await getSignedDownloadUrl(key, { bucket: R2_BUCKET_PUBLIC, expiresIn: 3600 })
    return NextResponse.json({ success: true, key, previewUrl }, { status: 200 })
  } catch (err) {
    console.error('POST /api/events/[id]/website-design/commit failed:', err)
    return NextResponse.json({ error: 'Failed to commit image' }, { status: 500 })
  }
}
