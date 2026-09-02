import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createServerClientMock, getUserMock, getUserProfileMock } = vi.hoisted(() => ({
  createServerClientMock: vi.fn(),
  getUserMock: vi.fn(),
  getUserProfileMock: vi.fn(),
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: createServerClientMock,
}))

vi.mock('@/lib/supabase/profile', () => ({
  getUserProfile: getUserProfileMock,
}))

import { middleware } from '@/middleware'

function request(path: string, host: string, headers?: HeadersInit): NextRequest {
  const requestHeaders = new Headers(headers)
  requestHeaders.set('host', host)
  return new NextRequest(`http://${host}${path}`, { headers: requestHeaders })
}

describe('middleware and session-gate composition', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY = 'test-key'
    process.env.VERCEL_ENV = 'preview'
    process.env.ADMIN_USER_IDS = 'admin-user'
    getUserMock.mockResolvedValue({ data: { user: null } })
    getUserProfileMock.mockResolvedValue({
      id: 'user-1',
      role_slug: 'host',
      display_name: 'Test',
      avatar_url: null,
      onboarding_completed: true,
    })
    createServerClientMock.mockImplementation((
      _url: unknown,
      _key: unknown,
      options: {
        cookies: {
          setAll: (cookies: Array<{ name: string; value: string; options?: Record<string, unknown> }>) => void
        }
      },
    ) => {
      options.cookies.setAll([{
        name: 'sb-test-auth-token',
        value: 'rotated',
        options: { path: '/' },
      }])
      return { auth: { getUser: getUserMock } }
    })
  })

  it('applies the preview admin override before the real admin gate', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'other-user' } } })

    const response = await middleware(request('/?surface=admin', 'preview-123.vercel.app'))

    expect(response.status).toBe(403)
    expect(response.headers.get('X-Frame-Options')).toBe('DENY')
  })

  it('ignores a production admin override and keeps the apex marketing route', async () => {
    process.env.VERCEL_ENV = 'production'

    const response = await middleware(request('/?surface=admin', 'evenzii.com'))

    expect(response.status).toBe(200)
    expect(response.headers.get('x-middleware-rewrite')).toContain('/marketing')
    expect(createServerClientMock).not.toHaveBeenCalled()
  })

  it('composes app-root auth redirects with host routing', async () => {
    const signedOutResponse = await middleware(request('/', 'app.localhost:3000'))
    expect(signedOutResponse.headers.get('location')).toContain('/auth')

    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    const signedInResponse = await middleware(request('/', 'app.localhost:3000'))
    expect(signedInResponse.headers.get('location')).toContain('/home')
  })

  it('keeps refreshed cookies when the real session middleware rewrites an app path', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } } })

    const response = await middleware(request('/home', 'app.localhost:3000'))

    expect(response.headers.get('x-middleware-rewrite')).toContain('/app/home')
    expect(response.cookies.get('sb-test-auth-token')?.value).toBe('rotated')
    expect(response.headers.get('set-cookie')).not.toContain('Domain=')
  })

  it('keeps API paths host-agnostic and unre-written', async () => {
    const response = await middleware(request('/api/events', 'admin.evenzii.com'))

    expect(response.status).toBe(200)
    expect(response.headers.get('x-middleware-rewrite')).toBeNull()
  })
})
