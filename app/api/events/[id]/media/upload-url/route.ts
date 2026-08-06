import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { requireEventWrite } from '@/lib/auth/eventAccess'
import { uploadUrlSchema, uuidSchema } from '@/lib/validations/media'
import { getSignedUploadUrl, R2_BUCKET_PRIVATE } from '@/lib/storage/r2'
import { mediaKey, mediaThumbKey } from '@/lib/storage/keys'
import { randomUUID } from 'crypto'

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

    const access = await requireEventWrite(supabase, id, user.id, 'media')
    if (!access.ok) return access.response


    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = uploadUrlSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const { kind, part, contentType } = parsed.data

    const uuid = randomUUID()
    const ext = contentType === 'image/webp' ? 'webp'
      : contentType === 'image/jpeg' ? 'jpg'
      : contentType === 'image/png' ? 'png'
      : contentType === 'image/avif' ? 'avif'
      : contentType === 'video/mp4' ? 'mp4'
      : 'mov'

    const key = part === 'thumb' ? mediaThumbKey(id, uuid) : mediaKey(id, uuid, ext)
    const expiresIn = part === 'master' && kind === 'video' ? 1800 : 300

    const url = await getSignedUploadUrl({
      bucket: R2_BUCKET_PRIVATE,
      key,
      contentType,
      expiresIn,
    })

    return NextResponse.json({ url, key }, { status: 200 })
  } catch (err) {
    console.error('POST /api/events/[id]/media/upload-url failed:', err)
    return NextResponse.json({ error: 'Failed to issue upload URL' }, { status: 500 })
  }
}
