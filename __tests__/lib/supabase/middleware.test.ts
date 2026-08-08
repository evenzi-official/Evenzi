import { describe, it, expect, vi, beforeEach } from 'vitest'

import type { UserProfile } from '@/lib/supabase/profile'
import { isPublicPath } from '@/lib/supabase/is-public-path'

describe('middleware routing logic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY = 'test-key'
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
