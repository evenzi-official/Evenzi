import { createHmac } from 'crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockFrom = vi.fn()
const mockRpc = vi.fn()

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({
    from: mockFrom,
    rpc: mockRpc,
  }),
}))

vi.mock('web-push', () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn().mockResolvedValue(undefined),
  },
  WebPushError: class WebPushError extends Error {
    statusCode: number
    constructor(message: string, statusCode: number) {
      super(message)
      this.statusCode = statusCode
    }
  },
}))

describe('POST /api/notifications/dispatch-push', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    process.env.NOTIFICATIONS_WEBHOOK_SECRET = 'test-webhook-secret-aaaaaaaa'
    process.env.VAPID_SUBJECT = 'mailto:test@evenzi.test'
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'BPublicKeyForTestsOnly________'
    process.env.VAPID_PRIVATE_KEY = 'privateKeyForTestsOnly________'
  })

  async function post(body: string, signature: string | null): Promise<Response> {
    const { POST } = await import('@/app/api/notifications/dispatch-push/route')
    const headers = new Headers({ 'content-type': 'application/json' })
    if (signature !== null) headers.set('x-evenzi-webhook-signature', signature)
    return POST(
      new Request('http://localhost/api/notifications/dispatch-push', {
        method: 'POST',
        headers,
        body,
      })
    )
  }

  it('accepts shared-secret header (Supabase http_request static header)', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({ insert })
    mockRpc.mockResolvedValue({ data: [], error: null })

    const body = JSON.stringify({
      type: 'INSERT',
      record: {
        id: '11111111-1111-4111-8111-111111111111',
        user_id: '22222222-2222-4222-8222-222222222222',
        title: 'Hi',
        body: 'There',
        link_path: null,
      },
    })

    const res = await post(body, process.env.NOTIFICATIONS_WEBHOOK_SECRET!)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(insert).toHaveBeenCalled()
  })

  it('accepts body HMAC signature', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({ insert })
    mockRpc.mockResolvedValue({ data: [], error: null })

    const body = JSON.stringify({
      type: 'INSERT',
      record: {
        id: '33333333-3333-4333-8333-333333333333',
        user_id: '44444444-4444-4444-8444-444444444444',
        title: 'Hi',
        body: 'There',
        link_path: '/home',
      },
    })
    const sig = createHmac('sha256', process.env.NOTIFICATIONS_WEBHOOK_SECRET!)
      .update(body)
      .digest('hex')

    const res = await post(body, sig)
    expect(res.status).toBe(200)
  })

  it('rejects bad signature', async () => {
    const body = JSON.stringify({
      type: 'INSERT',
      record: {
        id: '55555555-5555-4555-8555-555555555555',
        user_id: '66666666-6666-4666-8666-666666666666',
        title: 'Hi',
        body: 'There',
        link_path: null,
      },
    })
    const res = await post(body, 'deadbeef')
    expect(res.status).toBe(401)
  })
})
