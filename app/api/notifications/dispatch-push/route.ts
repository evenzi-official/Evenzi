import { createHmac, timingSafeEqual } from 'crypto'
import { createServiceClient } from '@/lib/supabase/service'
import webpush, { WebPushError } from 'web-push'
import { NextResponse } from 'next/server'

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 60

interface RateBucket {
  timestamps: number[]
}

const rateBuckets = new Map<string, RateBucket>()

interface NotificationRecord {
  id: string
  user_id: string
  title: string
  body: string
  link_path: string | null
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  return request.headers.get('x-real-ip') ?? 'unknown'
}

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const bucket = rateBuckets.get(ip) ?? { timestamps: [] }
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS)
  if (bucket.timestamps.length >= RATE_LIMIT_MAX) {
    rateBuckets.set(ip, bucket)
    return true
  }
  bucket.timestamps.push(now)
  rateBuckets.set(ip, bucket)
  return false
}

function verifySignature(rawBody: string, signatureHeader: string | null, secret: string): boolean {
  if (!signatureHeader) return false
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
  try {
    const a = Buffer.from(expected, 'utf8')
    const b = Buffer.from(signatureHeader, 'utf8')
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

function parseNotificationRecord(payload: unknown): NotificationRecord | null {
  if (typeof payload !== 'object' || payload === null) return null
  const root = payload as Record<string, unknown>

  const type = root.type ?? root.Type
  if (typeof type === 'string' && type.toUpperCase() !== 'INSERT') return null

  const recordRaw = root.record ?? root.Record
  if (typeof recordRaw !== 'object' || recordRaw === null) return null
  const record = recordRaw as Record<string, unknown>

  if (typeof record.id !== 'string') return null
  if (typeof record.user_id !== 'string') return null
  if (typeof record.title !== 'string') return null
  if (typeof record.body !== 'string') return null

  const linkPath = record.link_path
  if (linkPath !== null && linkPath !== undefined && typeof linkPath !== 'string') return null

  return {
    id: record.id,
    user_id: record.user_id,
    title: record.title,
    body: record.body,
    link_path: typeof linkPath === 'string' ? linkPath : null,
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const secret = process.env.NOTIFICATIONS_WEBHOOK_SECRET
    if (!secret) {
      return NextResponse.json({ error: 'Push dispatch not configured' }, { status: 503 })
    }

    if (isRateLimited(clientIp(request))) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const rawBody = await request.text()
    const signature = request.headers.get('x-evenzi-webhook-signature')
    if (!verifySignature(rawBody, signature, secret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let payload: unknown
    try {
      payload = JSON.parse(rawBody) as unknown
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const record = parseNotificationRecord(payload)
    if (!record) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 })
    }

    const service = createServiceClient()

    const { error: logError } = await service
      .from('push_dispatch_log')
      .insert({ notification_id: record.id })

    if (logError) {
      if (logError.code === '23505') {
        return NextResponse.json({ ok: true, skipped: true })
      }
      console.error('dispatch-push log insert failed:', logError)
      return NextResponse.json({ error: 'Failed to dispatch' }, { status: 500 })
    }

    const subject = process.env.VAPID_SUBJECT
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    const privateKey = process.env.VAPID_PRIVATE_KEY

    if (!subject || !publicKey || !privateKey) {
      console.error('dispatch-push missing VAPID env')
      return NextResponse.json({ error: 'Push dispatch not configured' }, { status: 503 })
    }

    webpush.setVapidDetails(subject, publicKey, privateKey)

    const { data: targets, error: targetsError } = await service.rpc(
      'get_push_delivery_targets',
      { p_user_id: record.user_id }
    )

    if (targetsError) {
      console.error('dispatch-push targets failed:', targetsError)
      return NextResponse.json({ error: 'Failed to dispatch' }, { status: 500 })
    }

    const payloadJson = JSON.stringify({
      title: record.title,
      body: record.body,
      linkPath: record.link_path ?? undefined,
    })

    for (const target of targets ?? []) {
      try {
        await webpush.sendNotification(
          {
            endpoint: target.endpoint,
            keys: {
              p256dh: target.p256dh,
              auth: target.auth_key,
            },
          },
          payloadJson
        )
      } catch (err: unknown) {
        const statusCode =
          err instanceof WebPushError
            ? err.statusCode
            : typeof err === 'object' && err !== null && 'statusCode' in err
              ? Number((err as { statusCode: unknown }).statusCode)
              : undefined

        if (statusCode === 410) {
          const { error: delError } = await service
            .from('push_subscriptions')
            .delete()
            .eq('endpoint', target.endpoint)
          if (delError) {
            console.error('dispatch-push 410 cleanup failed:', delError)
          }
        }
        // Swallow other send errors — do not fail the webhook
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    console.error('dispatch-push failed:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
