import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireEventWrite } from '@/lib/auth/eventAccess'
import { getSignedUploadUrl, R2_BUCKET_PUBLIC } from '@/lib/storage/r2'
import { websiteDesignKey } from '@/lib/storage/keys'

const uuidSchema = z.string().uuid()
const bodySchema = z.object({
  purpose: z.enum(['cover', 'og']),
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
}).strict()

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

    const { purpose, contentType } = parsed.data
    const ext = contentType === 'image/jpeg' ? 'jpg'
      : contentType === 'image/png' ? 'png'
      : contentType === 'image/avif' ? 'avif'
      : 'webp'

    const key = websiteDesignKey(id, purpose, randomUUID(), ext)
    const url = await getSignedUploadUrl({
      bucket: R2_BUCKET_PUBLIC,
      key,
      contentType,
      expiresIn: 300,
    })

    return NextResponse.json({ url, key }, { status: 200 })
  } catch (err) {
    console.error('POST /api/events/[id]/website-design/upload-url failed:', err)
    return NextResponse.json({ error: 'Failed to issue upload URL' }, { status: 500 })
  }
}
