import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createServerClientMock, getUserProfileMock } = vi.hoisted(() => ({
  createServerClientMock: vi.fn(),
  getUserProfileMock: vi.fn(),
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: createServerClientMock,
}))

vi.mock('@/lib/supabase/profile', () => ({
  getUserProfile: getUserProfileMock,
}))

import { GET } from '@/app/auth/callback/route'

describe('auth callback route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY = 'test-key'
  })

  it('redirects to auth failure when the code is missing', async () => {
    const request = new NextRequest('http://localhost/auth/callback')

    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost/auth?error=auth_failed')
    expect(createServerClientMock).not.toHaveBeenCalled()
  })

  it('preserves session cookies and redirects users with a role to /home', async () => {
    createServerClientMock.mockImplementation((_url: string, _key: string, { cookies }: { cookies: { setAll: (cookies: Array<{ name: string; value: string; options: Record<string, unknown> }>) => void } }) => ({
      auth: {
        exchangeCodeForSession: vi.fn(async () => {
          cookies.setAll([{
            name: 'sb-access-token',
            value: 'token-123',
            options: { httpOnly: true, path: '/', sameSite: 'lax' },
          }])

          return {
            data: { user: { id: 'user-1' } },
            error: null,
          }
        }),
      },
    }))
    getUserProfileMock.mockResolvedValue({
      id: 'user-1',
      role_slug: 'host',
      display_name: 'Test User',
      avatar_url: null,
      onboarding_completed: true,
    })

    const request = new NextRequest('http://localhost/auth/callback?code=test-code')
    const response = await GET(request)

    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toBe('http://localhost/home')
    expect(response.cookies.get('sb-access-token')?.value).toBe('token-123')
    expect(getUserProfileMock).toHaveBeenCalledWith(expect.anything(), 'user-1')
  })

  it('redirects users without a role to role selection', async () => {
    createServerClientMock.mockImplementation((_url: string, _key: string, { cookies }: { cookies: { setAll: (cookies: Array<{ name: string; value: string; options: Record<string, unknown> }>) => void } }) => ({
      auth: {
        exchangeCodeForSession: vi.fn(async () => {
          cookies.setAll([{
            name: 'sb-access-token',
            value: 'token-456',
            options: { httpOnly: true, path: '/' },
          }])

          return {
            data: { user: { id: 'user-2' } },
            error: null,
          }
        }),
      },
    }))
    getUserProfileMock.mockResolvedValue(null)

    const request = new NextRequest('http://localhost/auth/callback?code=test-code')
    const response = await GET(request)

    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toBe('http://localhost/auth/role-selection')
    expect(response.cookies.get('sb-access-token')?.value).toBe('token-456')
  })

  it('redirects to auth failure when the exchange fails', async () => {
    createServerClientMock.mockImplementation(() => ({
      auth: {
        exchangeCodeForSession: vi.fn(async () => ({
          data: { user: null },
          error: { message: 'exchange failed' },
        })),
      },
    }))

    const request = new NextRequest('http://localhost/auth/callback?code=test-code')
    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost/auth?error=auth_failed')
  })
})
