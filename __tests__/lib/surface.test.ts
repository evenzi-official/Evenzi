import { describe, expect, it, vi } from 'vitest'
import {
  isSurfacePrefixed,
  normalizePathname,
  resolveSurface,
  type Surface,
} from '@/lib/surface'

describe('surface resolution', () => {
  it.each([
    ['app.evenzii.com', 'app'],
    ['app.evenzii.com:443', 'app'],
    ['evenzii.com', 'marketing'],
    ['www.evenzii.com', 'marketing'],
    ['admin.evenzii.com', 'admin'],
    ['app.localhost:3000', 'app'],
    ['admin.localhost:3000', 'admin'],
    ['localhost:3000', 'marketing'],
    ['marketing.localhost:3000', 'marketing'],
    ['app.evenzii.com.attacker.com', 'marketing'],
    ['app.evil.com', 'marketing'],
    ['evenzi.vercel.app', 'app'],
    ['evenzi.vercel.app.attacker.com', 'marketing'],
  ])('maps %s to %s', (host, expected) => {
    expect(resolveSurface({ host })).toBe(expected as Surface)
  })

  it('defaults evenzi.vercel.app to app even with no override present, so client-side redirects that drop ?surface= still land correctly', () => {
    // Regression: post-OTP-verify does an in-app redirect (e.g. to
    // /auth/role-selection) without carrying ?surface=app forward. Without
    // an explicit host case, that request would fall through to the
    // unrecognized-host default ('marketing') and 404, breaking login for
    // anyone clicking through on the staging alias.
    expect(resolveSurface({
      host: 'evenzi.vercel.app',
      vercelEnv: 'production',
    })).toBe('app')
  })

  it('ignores x-forwarded-host when resolving the surface', () => {
    expect(resolveSurface({
      host: 'evenzii.com',
      forwardedHost: 'admin.evenzii.com',
    })).toBe('marketing')
  })

  it('honors preview surface overrides', () => {
    expect(resolveSurface({
      host: 'preview-123.vercel.app',
      surfaceParam: 'app',
      vercelEnv: 'preview',
    })).toBe('app')
    expect(resolveSurface({
      host: 'preview-123.vercel.app',
      surfaceHeader: 'admin',
      vercelEnv: 'preview',
    })).toBe('admin')
  })

  it('ignores surface overrides in production', () => {
    expect(resolveSurface({
      host: 'evenzii.com',
      surfaceParam: 'admin',
      surfaceHeader: 'admin',
      vercelEnv: 'production',
    })).toBe('marketing')
  })

  it('ignores overrides in a production runtime even without VERCEL_ENV', () => {
    const originalVercelEnv = process.env.VERCEL_ENV
    try {
      vi.stubEnv('NODE_ENV', 'production')
      delete process.env.VERCEL_ENV
      expect(resolveSurface({
        host: 'evenzii.com',
        surfaceParam: 'admin',
      })).toBe('marketing')
    } finally {
      vi.unstubAllEnvs()
      if (originalVercelEnv === undefined) delete process.env.VERCEL_ENV
      else process.env.VERCEL_ENV = originalVercelEnv
    }
  })

  it('honors overrides on a real Vercel preview deploy (NODE_ENV=production is always true post-build)', () => {
    // Regression: `next build` always bakes NODE_ENV=production, on preview
    // deploys too. VERCEL_ENV is the only signal that actually distinguishes
    // preview from production on Vercel, so it must be trusted on its own
    // whenever Vercel sets it — requiring NODE_ENV!=='production' too made
    // the override dead code on every real deployment.
    vi.stubEnv('NODE_ENV', 'production')
    try {
      expect(resolveSurface({
        host: 'preview-123.vercel.app',
        surfaceParam: 'admin',
        vercelEnv: 'preview',
      })).toBe('admin')
    } finally {
      vi.unstubAllEnvs()
    }
  })

  it('honors overrides on the evenzi.vercel.app staging alias even under VERCEL_ENV=production', () => {
    expect(resolveSurface({
      host: 'evenzi.vercel.app',
      surfaceParam: 'admin',
      vercelEnv: 'production',
    })).toBe('admin')
    expect(resolveSurface({
      host: 'evenzi.vercel.app',
      surfaceParam: 'app',
      vercelEnv: 'production',
    })).toBe('app')
  })

  it('still ignores overrides on the real production host, not just the staging alias', () => {
    expect(resolveSurface({
      host: 'evenzii.com',
      surfaceParam: 'admin',
      vercelEnv: 'production',
    })).toBe('marketing')
  })
})

describe('pathname normalization', () => {
  it.each([
    ['/%2fadmin', '/admin'],
    ['//admin', '/admin'],
    ['/./admin', '/admin'],
    ['/app/../admin', '/admin'],
  ])('normalizes %s before prefix checks', (pathname, expected) => {
    expect(normalizePathname(pathname)).toBe(expected)
    expect(isSurfacePrefixed(normalizePathname(pathname) ?? '')).toBe(true)
  })
})
