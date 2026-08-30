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
  ])('maps %s to %s', (host, expected) => {
    expect(resolveSurface({ host })).toBe(expected as Surface)
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
