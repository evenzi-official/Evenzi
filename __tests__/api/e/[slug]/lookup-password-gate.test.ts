/**
 * Lookup must refuse guest identification when website password is enabled
 * and evz_site_pw is missing/invalid (platform truth P0-2).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost'
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY = 'test-key'

const { createClientMock } = vi.hoisted(() => ({ createClientMock: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({ createClient: createClientMock }))
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    get: () => undefined,
    getAll: () => [],
    set: vi.fn(),
  }),
}))

import { POST } from '@/app/api/e/[slug]/lookup/route'
import { cookies } from 'next/headers'

const SLUG = 'passworded-wedding'
const ctx = { params: Promise.resolve({ slug: SLUG }) }

function req(body: Record<string, unknown>) {
  return new Request(`http://localhost/api/e/${SLUG}/lookup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/e/[slug]/lookup — password gate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(cookies).mockResolvedValue({
      get: () => undefined,
      getAll: () => [],
      set: vi.fn(),
    } as never)
  })

  it('returns 401 Password required when password_enabled and no pw cookie', async () => {
    const rpc = vi.fn().mockImplementation(async (name: string) => {
      if (name === 'get_public_website_payload') {
        return { data: { password_enabled: true }, error: null }
      }
      if (name === 'is_website_password_verified') {
        return { data: false, error: null }
      }
      throw new Error(`unexpected rpc ${name}`)
    })
    createClientMock.mockResolvedValue({ rpc })

    const res = await POST(req({ phone: '9999999999', name: 'Test Guest' }), ctx)
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Password required')
    expect(rpc).toHaveBeenCalledWith('get_public_website_payload', { p_slug: SLUG })
    expect(rpc).not.toHaveBeenCalledWith(
      'resolve_guest_by_lookup',
      expect.anything()
    )
  })

  it('proceeds to lookup when password verified', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: (name: string) => (name === 'evz_site_pw' ? { value: 'pw-token' } : undefined),
      getAll: () => [],
      set: vi.fn(),
    } as never)

    const chain = {
      setHeader: vi.fn().mockResolvedValue({ data: 'guest-token', error: null }),
    }
    const rpc = vi.fn().mockImplementation(async (name: string) => {
      if (name === 'get_public_website_payload') {
        return { data: { password_enabled: true }, error: null }
      }
      if (name === 'is_website_password_verified') {
        return { data: true, error: null }
      }
      if (name === 'resolve_guest_by_lookup') {
        return chain
      }
      throw new Error(`unexpected rpc ${name}`)
    })
    // resolve_guest_by_lookup is called as rpc(...).setHeader(...)
    rpc.mockImplementation((name: string) => {
      if (name === 'get_public_website_payload') {
        return Promise.resolve({ data: { password_enabled: true }, error: null })
      }
      if (name === 'is_website_password_verified') {
        return Promise.resolve({ data: true, error: null })
      }
      if (name === 'resolve_guest_by_lookup') {
        return chain
      }
      return Promise.resolve({ data: null, error: { message: 'unexpected' } })
    })
    createClientMock.mockResolvedValue({ rpc })

    const res = await POST(req({ phone: '9999999999', name: 'Test Guest' }), ctx)
    expect(res.status).toBe(200)
    expect(chain.setHeader).toHaveBeenCalled()
  })
})
