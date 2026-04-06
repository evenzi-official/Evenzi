import { describe, it, expect, vi, beforeEach } from 'vitest'
import { signWebhookPayload } from '@/lib/amc/utils/webhook'

// Mock the Supabase client so we don't hit the real DB in unit tests
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'test-project-id',
          webhook_secret: 'test-secret-abc123',
        },
        error: null,
      }),
      insert: vi.fn().mockResolvedValue({ error: null }),
    })),
  })),
}))

// Import AFTER mocking
const { POST } = await import('./route')

function makeRequest(body: object, projectId: string, secret: string) {
  const bodyStr = JSON.stringify(body)
  const signature = signWebhookPayload(bodyStr, secret)

  return new Request('http://localhost/api/amc/webhooks/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-AMC-Project-Id': projectId,
      'X-AMC-Signature': signature,
    },
    body: bodyStr,
  })
}

describe('POST /api/amc/webhooks/events', () => {
  it('returns 400 when X-AMC-Project-Id header is missing', async () => {
    const req = new Request('http://localhost/api/amc/webhooks/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    })
    const res = await POST(req as never)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('X-AMC-Project-Id')
  })

  it('returns 401 when signature is invalid', async () => {
    const req = new Request('http://localhost/api/amc/webhooks/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AMC-Project-Id': 'test-project-id',
        'X-AMC-Signature': 'badsignature1234567890abcdef1234567890abcdef1234567890abcdef1234',
      },
      body: '{"type":"test"}',
    })
    const res = await POST(req as never)
    expect(res.status).toBe(401)
  })

  it('returns 200 for valid signed event', async () => {
    const req = makeRequest(
      { type: 'agent.started', runId: 'run-1', agentId: 'agent-1', stageOrder: 0, input: {} },
      'test-project-id',
      'test-secret-abc123'
    )
    const res = await POST(req as never)
    expect(res.status).toBe(200)
  })
})
