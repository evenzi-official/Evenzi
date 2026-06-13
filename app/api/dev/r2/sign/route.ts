/**
 * DEV-ONLY spike route: mint a short-lived signed GET URL for a private key.
 * NO auth (404 in production). See the design spec for the production route.
 */
import { NextResponse } from 'next/server'
import { getSignedDownloadUrl } from '@/lib/storage/r2'

export async function POST(request: Request): Promise<NextResponse> {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  let body: { key?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.key) {
    return NextResponse.json({ error: 'key is required' }, { status: 400 })
  }

  try {
    const url = await getSignedDownloadUrl(body.key, { expiresIn: 3600 })
    return NextResponse.json({ url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'R2 error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
