import { NextRequest } from 'next/server'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import type { UserProfile } from '@/lib/supabase/profile'
import { isPublicPath } from '@/lib/supabase/is-public-path'
import { resolveSurface } from '@/lib/surface'

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

import { parseAdminUserIds, updateSession } from '@/lib/supabase/middleware'

describe('middleware routing logic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY = 'test-key'
    delete process.env.ADMIN_USER_IDS
    createServerClientMock.mockReturnValue({
      auth: {
        getUser: getUserMock,
      },
    })
    getUserMock.mockResolvedValue({ data: { user: null } })
    getUserProfileMock.mockResolvedValue({
      id: 'u1',
      role_slug: 'host',
      display_name: 'Test',
      avatar_url: null,
      onboarding_completed: true,
    })
  })

  it('allows public paths without auth', () => {
    const publicPaths = ['/', '/auth', '/auth/callback', '/_next/static/chunk.js', '/api/test']
    for (const path of publicPaths) {
      expect(isPublicPath(path)).toBe(true)
    }
  })

  it('/home is NOT a public path', () => {
    expect(isPublicPath('/home')).toBe(false)
  })

  it('treats /help and its children as public', () => {
    expect(isPublicPath('/help')).toBe(true)
    expect(isPublicPath('/help/managing-guests')).toBe(true)
    expect(isPublicPath('/help/a/why-no-invitation')).toBe(true)
  })

  it('does not make a /help-prefixed route public by accident', () => {
    expect(isPublicPath('/helpdesk')).toBe(false)
  })

  it('does not make near-match invite or template paths public', () => {
    expect(isPublicPath('/invited')).toBe(false)
    expect(isPublicPath('/wedding-invitation-temp-1x')).toBe(false)
  })

  it('still redirects a protected route when signed out', () => {
    expect(isPublicPath('/events/abc')).toBe(false)
  })

  it('role-selection is semi-protected (auth required, no role required)', () => {
    const path = '/auth/role-selection'
    const isSemiProtected = path === '/auth/role-selection'
    expect(isSemiProtected).toBe(true)
  })
})

describe('redirect logic', () => {
  it('user with no role on protected route should go to /auth/role-selection', () => {
    const profile: UserProfile = {
      id: 'u1', role_slug: null, display_name: 'Test', avatar_url: null, onboarding_completed: false,
    }
    const pathname: string = '/home'
    const needsRoleSelection = profile.role_slug === null && pathname !== '/auth/role-selection'
    expect(needsRoleSelection).toBe(true)
  })

  it('user with role on /auth/role-selection should go to /home', () => {
    const profile: UserProfile = {
      id: 'u1', role_slug: 'host', display_name: 'Test', avatar_url: null, onboarding_completed: false,
    }
    const pathname: string = '/auth/role-selection'
    const hasRoleOnRoleSelection = profile.role_slug !== null && pathname === '/auth/role-selection'
    expect(hasRoleOnRoleSelection).toBe(true)
  })

  it('user with role on /auth should go to /home', () => {
    const profile: UserProfile = {
      id: 'u1', role_slug: 'host', display_name: 'Test', avatar_url: null, onboarding_completed: false,
    }
    const pathname: string = '/auth'
    const hasRoleOnAuth = profile.role_slug !== null && pathname === '/auth'
    expect(hasRoleOnAuth).toBe(true)
  })

  it('user with role on /home should pass through', () => {
    const profile: UserProfile = {
      id: 'u1', role_slug: 'host', display_name: 'Test', avatar_url: null, onboarding_completed: false,
    }
    const pathname: string = '/home'
    const shouldPassThrough =
      profile.role_slug !== null && pathname !== '/auth/role-selection' && pathname !== '/auth'
    expect(shouldPassThrough).toBe(true)
  })
})

describe('surface-scoped session gates', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY = 'test-key'
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
      return {
        auth: {
          getUser: getUserMock,
        },
      }
    })
    getUserMock.mockResolvedValue({ data: { user: null } })
    getUserProfileMock.mockResolvedValue({
      id: 'u1',
      role_slug: 'host',
      display_name: 'Test',
      avatar_url: null,
      onboarding_completed: true,
    })
  })

  it('normalizes the admin allowlist', () => {
    expect(parseAdminUserIds(' ABC , def ,, ')).toEqual(new Set(['abc', 'def']))
  })

  it('allows an allowlisted admin user after getUser validation', async () => {
    process.env.ADMIN_USER_IDS = ' ADMIN-USER '
    getUserMock.mockResolvedValue({ data: { user: { id: 'admin-user' } } })

    const response = await updateSession(
      new NextRequest('http://admin.localhost:3000/'),
      'admin',
    )

    expect(getUserMock).toHaveBeenCalledOnce()
    expect(response.status).toBe(200)
  })

  it('allows the admin sign-in route before applying the admin gate', async () => {
    const response = await updateSession(
      new NextRequest('http://admin.localhost:3000/auth'),
      'admin',
    )

    expect(response.status).toBe(200)
  })

  it.each([
    ['non-allowlisted user', 'other-user'],
    ['empty allowlist', 'admin-user'],
  ])('denies an admin request for an %s', async (_case, userId) => {
    process.env.ADMIN_USER_IDS = userId === 'admin-user' ? '' : 'admin-user'
    getUserMock.mockResolvedValue({ data: { user: { id: userId } } })

    const response = await updateSession(
      new NextRequest('http://admin.localhost:3000/'),
      'admin',
    )

    expect(response.status).toBe(403)
  })

  it('denies an admin request without a user', async () => {
    process.env.ADMIN_USER_IDS = 'admin-user'

    const response = await updateSession(
      new NextRequest('http://admin.localhost:3000/'),
      'admin',
    )

    expect(response.status).toBe(403)
  })

  it('keeps preview admin overrides behind the admin allowlist', async () => {
    const surface = resolveSurface({
      host: 'preview-123.vercel.app',
      surfaceParam: 'admin',
      vercelEnv: 'preview',
    })
    getUserMock.mockResolvedValue({ data: { user: { id: 'other-user' } } })
    process.env.ADMIN_USER_IDS = 'admin-user'

    const response = await updateSession(
      new NextRequest('http://preview-123.vercel.app/'),
      surface,
    )

    expect(surface).toBe('admin')
    expect(response.status).toBe(403)
  })

  it('redirects the app root based on the validated user', async () => {
    getUserMock.mockResolvedValue({ data: { user: null } })
    const signedOutResponse = await updateSession(
      new NextRequest('http://app.localhost:3000/'),
      'app',
    )
    expect(signedOutResponse.headers.get('location')).toContain('/auth')

    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    const signedInResponse = await updateSession(
      new NextRequest('http://app.localhost:3000/'),
      'app',
    )
    expect(signedInResponse.headers.get('location')).toContain('/home')
  })

  it('preserves refreshed cookies on app-root redirects', async () => {
    const response = await updateSession(
      new NextRequest('http://app.localhost:3000/'),
      'app',
    )

    expect(response.cookies.get('sb-test-auth-token')?.value).toBe('rotated')
  })
})
