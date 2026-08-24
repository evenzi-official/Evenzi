import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { requireEventWrite } from '@/lib/auth/eventAccess'
import { invitationUploadUrlSchema, uuidSchema } from '@/lib/validations/invitations'
import { getSignedUploadUrl, R2_BUCKET_PUBLIC } from '@/lib/storage/r2'
import { invitationBgKey, invitationUploadKey } from '@/lib/storage/keys'
import { randomUUID } from 'crypto'

// NOTE (plan-review fix A): images go to the PUBLIC bucket so the existing
// media/[...key] proxy can serve them with no new read route. Verify the exact
// export name for the public bucket in lib/storage/r2 (R2_BUCKET_PUBLIC); if the
// module only exports R2_BUCKET_PRIVATE, add an R2_BUCKET_PUBLIC export reading
// process.env.R2_BUCKET_PUBLIC (default 'evenzi-public', matching the proxy).

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

    const access = await requireEventWrite(supabase, id, user.id, 'invitations')
    if (!access.ok) return access.response

    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
    const parsed = invitationUploadUrlSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const { part, contentType } = parsed.data
    const ext = contentType === 'image/png' ? 'png' : 'jpg'
    const uuid = randomUUID()
    const key = part === 'photo_bg' ? invitationBgKey(id, uuid, ext) : invitationUploadKey(id, uuid, ext)

    const url = await getSignedUploadUrl({ bucket: R2_BUCKET_PUBLIC, key, contentType, expiresIn: 300 })
    return NextResponse.json({ url, key }, { status: 200 })
  } catch (err) {
    console.error('POST /api/events/[id]/invitation-card/upload-url failed:', err)
    return NextResponse.json({ error: 'Failed to issue upload URL' }, { status: 500 })
  }
}
