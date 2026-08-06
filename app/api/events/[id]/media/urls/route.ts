import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { requireEventWrite } from '@/lib/auth/eventAccess'
import { batchUrlsSchema, uuidSchema } from '@/lib/validations/media'
import { getSignedDownloadUrl, R2_BUCKET_PRIVATE } from '@/lib/storage/r2'

const SIGNED_URL_EXPIRES_IN = 3600

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

    const parsed = batchUrlsSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { data: rows } = await supabase
      .from('event_media')
      .select('id, storage_key, thumbnail_key')
      .eq('event_id', id)
      .in('id', parsed.data.mediaIds)

    const result: Record<string, { url: string; thumbUrl?: string; expiresAt: number }> = {}
    await Promise.all(
      (rows ?? []).map(async (row: { id: string; storage_key: string; thumbnail_key: string | null }) => {
        const [url, thumbUrl] = await Promise.all([
          getSignedDownloadUrl(row.storage_key, {
            bucket: R2_BUCKET_PRIVATE,
            expiresIn: SIGNED_URL_EXPIRES_IN,
          }),
          row.thumbnail_key
            ? getSignedDownloadUrl(row.thumbnail_key, {
                bucket: R2_BUCKET_PRIVATE,
                expiresIn: SIGNED_URL_EXPIRES_IN,
              })
            : Promise.resolve(undefined),
        ])
        result[row.id] = { url, thumbUrl, expiresAt: Date.now() + SIGNED_URL_EXPIRES_IN * 1000 }
      })
    )

    return NextResponse.json(result, { status: 200 })
  } catch (err) {
    console.error('POST /api/events/[id]/media/urls failed:', err)
    return NextResponse.json({ error: 'Failed to sign URLs' }, { status: 500 })
  }
}
