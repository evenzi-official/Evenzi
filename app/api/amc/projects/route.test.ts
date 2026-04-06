import { describe, it, expect, vi } from 'vitest'

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
        insert: vi.fn(() => ({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
    })
  ),
}))

// Mock webhook utils so secret generation is deterministic
vi.mock('@/lib/amc/utils/webhook', () => ({
  generateWebhookSecret: vi.fn(() => 'test-webhook-secret-64chars-hex-string-placeholder-xx'),
  signWebhookPayload: vi.fn(),
  verifyWebhookSignature: vi.fn(),
}))

const { GET, POST } = await import('./route')

describe('GET /api/amc/projects', () => {
  it('returns 200 with projects array', async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toHaveProperty('projects')
    expect(Array.isArray(json.projects)).toBe(true)
  })
})

describe('POST /api/amc/projects', () => {
  it('returns 400 when name is missing', async () => {
    const req = new Request('http://localhost/api/amc/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('name')
  })

  it('returns 400 when name is empty string', async () => {
    const req = new Request('http://localhost/api/amc/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '   ' }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(400)
  })
})
