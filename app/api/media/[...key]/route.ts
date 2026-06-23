import { S3Client, GetObjectCommand, NoSuchKey } from '@aws-sdk/client-s3'
import type { NextRequest } from 'next/server'

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
  },
})

const BUCKET = process.env.R2_BUCKET_PUBLIC || 'evenzi-public'

// Only these top-level prefixes are servable through the public proxy. The
// bucket is hardcoded-public so cross-bucket traversal isn't possible, but this
// stops callers from fetching arbitrary keys by guessing — narrow the proxy to
// the namespaces we actually publish (see app/api/events/cover R2 key layout).
const ALLOWED_PREFIXES = ['events/', 'event-covers/', 'website/'] as const

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
): Promise<Response> {
  const { key: parts } = await params
  const key = parts.join('/')

  // Reject traversal attempts and keys outside the allowlisted namespaces.
  if (key.includes('..') || !ALLOWED_PREFIXES.some((prefix) => key.startsWith(prefix))) {
    return new Response('Not found', { status: 404 })
  }

  try {
    const result = await client.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }))
    if (!result.Body) return new Response('Not found', { status: 404 })

    const bytes = await result.Body.transformToByteArray()

    return new Response(Buffer.from(bytes), {
      status: 200,
      headers: {
        'Content-Type': result.ContentType ?? 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': String(result.ContentLength ?? bytes.length),
      },
    })
  } catch (err) {
    if (err instanceof NoSuchKey) return new Response('Not found', { status: 404 })
    console.error('R2 proxy error:', err)
    return new Response('Storage error', { status: 500 })
  }
}
