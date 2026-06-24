/**
 * DEV-ONLY spike route to validate the R2 round-trip from the sample test page.
 * Returns a presigned PUT URL under a `dev/` key. NO auth (404 in production).
 * The production storage routes (auth + scope ownership) live under /api/storage/*
 * per docs/superpowers/specs/2026-06-13-cloudflare-r2-storage-design.md.
 */
import { NextResponse } from 'next/server'
import {
  getSignedUploadUrl,
  getPublicUrl,
  R2_BUCKET_PUBLIC,
  R2_BUCKET_PRIVATE,
} from '@/lib/storage/r2'

const ALLOWED_TYPES = ['image/webp', 'image/jpeg', 'image/png', 'image/avif']

export async function POST(request: Request): Promise<NextResponse> {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  let body: { contentType?: string; ext?: string; visibility?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { contentType, ext, visibility } = body
  if (!contentType || !ALLOWED_TYPES.includes(contentType)) {
    return NextResponse.json({ error: 'Disallowed or missing content-type' }, { status: 400 })
  }

  const isPublic = visibility === 'public'
  const bucket = isPublic ? R2_BUCKET_PUBLIC : R2_BUCKET_PRIVATE
  const safeExt = (ext || 'webp').replace(/[^a-z0-9]/gi, '').slice(0, 5) || 'webp'
  const key = `dev/${crypto.randomUUID()}.${safeExt}`

  try {
    const url = await getSignedUploadUrl({ bucket, key, contentType })
    return NextResponse.json({
      url,
      key,
      bucket,
      publicUrl: isPublic ? getPublicUrl(key) : null,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'R2 error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
