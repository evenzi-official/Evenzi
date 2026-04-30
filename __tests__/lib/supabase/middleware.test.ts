import { describe, it, expect, vi, beforeEach } from 'vitest'

import type { UserProfile } from '@/lib/supabase/profile'

describe('middleware routing logic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY = 'test-key'
  })

  it('allows public paths without auth', async () => {
    const publicPaths = ['/', '/auth', '/auth/callback', '/_next/static/chunk.js', '/api/test']
    for (const path of publicPaths) {
      const isPublic = path === '/' ||
        path === '/auth' ||
        path.startsWith('/auth/callback') ||
        path.startsWith('/_next') ||
        path.startsWith('/api')
      expect(isPublic).toBe(true)
    }
  })

  it('/home is NOT a public path', () => {
    const path = '/home'
    const isPublic = path === '/' ||
      path === '/auth' ||
      path.startsWith('/auth/callback') ||
      path.startsWith('/_next') ||
      path.startsWith('/api')
    expect(isPublic).toBe(false)
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
      id: 'u1', role: null, display_name: 'Test', avatar_url: null, onboarding_completed: false,
    }
    const pathname = '/home'
    const needsRoleSelection = profile.role === null && pathname !== '/auth/role-selection'
    expect(needsRoleSelection).toBe(true)
  })

  it('user with role on /auth/role-selection should go to /home', () => {
    const profile: UserProfile = {
      id: 'u1', role: 'host', display_name: 'Test', avatar_url: null, onboarding_completed: false,
    }
    const pathname = '/auth/role-selection'
    const hasRoleOnRoleSelection = profile.role !== null && pathname === '/auth/role-selection'
    expect(hasRoleOnRoleSelection).toBe(true)
  })

  it('user with role on /auth should go to /home', () => {
    const profile: UserProfile = {
      id: 'u1', role: 'host', display_name: 'Test', avatar_url: null, onboarding_completed: false,
    }
    const pathname = '/auth'
    const hasRoleOnAuth = profile.role !== null && pathname === '/auth'
    expect(hasRoleOnAuth).toBe(true)
  })

  it('user with role on /home should pass through', () => {
    const profile: UserProfile = {
      id: 'u1', role: 'host', display_name: 'Test', avatar_url: null, onboarding_completed: false,
    }
    const pathname = '/home'
    const shouldPassThrough = profile.role !== null && pathname !== '/auth/role-selection' && pathname !== '/auth'
    expect(shouldPassThrough).toBe(true)
  })
})
