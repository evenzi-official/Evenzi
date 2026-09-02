import { NextRequest, NextResponse } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { updateSessionMock } = vi.hoisted(() => ({
  updateSessionMock: vi.fn(),
}))

vi.mock('@/lib/supabase/middleware', () => ({
  updateSession: updateSessionMock,
}))

import { config, middleware } from '@/middleware'

function request(path: string, host = 'app.localhost:3000', headers?: HeadersInit): NextRequest {
  const requestHeaders = new Headers(headers)
  requestHeaders.set('host', host)
  return new NextRequest(`http://${host}${path}`, { headers: requestHeaders })
}

describe('surface middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.VERCEL_ENV = 'preview'
    updateSessionMock.mockImplementation((incoming: NextRequest) => NextResponse.next({ request: incoming }))
  })

  it('rewrites app paths and preserves Supabase refresh cookies', async () => {
    updateSessionMock.mockImplementation((incoming: NextRequest) => {
      const response = NextResponse.next({ request: incoming })
      response.cookies.set('sb-test-auth-token', 'rotated')
      return response
    })

    const response = await middleware(request('/home'))

    expect(response.headers.get('x-middleware-rewrite')).toContain('/app/home')
    expect(response.cookies.get('sb-test-auth-token')?.value).toBe('rotated')
    expect(response.headers.get('set-cookie')).not.toContain('Domain=')
  })

  it.each(['/admin', '/%2fadmin', '//admin', '/./admin'])(
    'rejects a surface-prefixed path before rewriting: %s',
    async (path) => {
      const response = await middleware(request(path))
      expect(response.status).toBe(404)
    },
  )

  it('does not trust x-forwarded-host for surface selection', async () => {
    const response = await middleware(request('/', 'evenzii.com', {
      'x-forwarded-host': 'admin.evenzii.com',
    }))

    expect(response.status).toBe(200)
    expect(response.headers.get('x-middleware-rewrite')).toContain('/marketing')
  })

  it('honors preview surface overrides', async () => {
    const response = await middleware(request('/?surface=app', 'preview-123.vercel.app'))

    expect(response.status).toBe(200)
    expect(response.headers.get('x-middleware-rewrite')).toContain('/app')
  })

  it('ignores preview surface overrides in production', async () => {
    process.env.VERCEL_ENV = 'production'
    const response = await middleware(request('/?surface=app', 'evenzii.com'))

    expect(response.status).toBe(200)
    expect(response.headers.get('x-middleware-rewrite')).toContain('/marketing')
  })

  it('pins guest websites to the app host', async () => {
    const marketingResponse = await middleware(request('/e/demo', 'evenzii.com'))
    const dottedMarketingResponse = await middleware(request('/e/event.css', 'evenzii.com'))
    const appResponse = await middleware(request('/e/demo', 'app.evenzii.com'))

    expect(marketingResponse.status).toBe(404)
    expect(dottedMarketingResponse.status).toBe(404)
    expect(appResponse.status).toBe(200)
    expect(appResponse.headers.get('x-middleware-rewrite')).toBeNull()
  })

  it('serves the app manifest only on the app host', async () => {
    const appResponse = await middleware(request('/manifest.webmanifest', 'app.evenzii.com'))
    const marketingResponse = await middleware(request('/manifest.webmanifest', 'evenzii.com'))

    expect(appResponse.status).toBe(200)
    expect(appResponse.headers.get('x-middleware-rewrite')).toContain('/app/manifest.webmanifest')
    expect(marketingResponse.status).toBe(404)
  })

  it('applies stricter security headers to the admin surface', async () => {
    const adminResponse = await middleware(request('/', 'admin.evenzii.com'))
    const marketingResponse = await middleware(request('/', 'evenzii.com'))

    expect(adminResponse.headers.get('Content-Security-Policy')).toContain("frame-ancestors 'none'")
    expect(adminResponse.headers.get('X-Frame-Options')).toBe('DENY')
    expect(marketingResponse.headers.get('X-Frame-Options')).toBe('SAMEORIGIN')
  })

  it('routes admin authentication through the app auth pages', async () => {
    const response = await middleware(request('/auth', 'admin.evenzii.com'))

    expect(response.status).toBe(200)
    expect(response.headers.get('x-middleware-rewrite')).toContain('/app/auth')
  })

  it.each(['/', '/home'])(
    'does not rewrite a terminal admin 403 (no target-route render under 403): %s',
    async (path) => {
      // The admin gate in updateSession returns a terminal 403 for a denied user.
      updateSessionMock.mockImplementation(() => new NextResponse('Forbidden', { status: 403 }))

      const response = await middleware(request(path, 'admin.evenzii.com'))

      expect(response.status).toBe(403)
      // Must NOT carry a rewrite — otherwise Next renders /admin (content leak) or
      // /admin/home (404), clobbering the gate's 403.
      expect(response.headers.get('x-middleware-rewrite')).toBeNull()
    },
  )

  it.each(['/api/events', '/_next/static/chunk.js', '/dev/r2-test'])(
    'passes shared path through without a surface rewrite: %s',
    async (path) => {
      const response = await middleware(request(path, 'admin.evenzii.com'))
      expect(response.status).toBe(200)
      expect(response.headers.get('x-middleware-rewrite')).toBeNull()
    },
  )

  it('routes dotted app slugs instead of treating them as static assets', async () => {
    const response = await middleware(request('/help/foo.bar'))

    expect(response.status).toBe(200)
    expect(response.headers.get('x-middleware-rewrite')).toContain('/app/help/foo.bar')
  })

  it('routes /dev through the app surface in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    try {
      const response = await middleware(request('/dev'))

      expect(response.status).toBe(200)
      expect(response.headers.get('x-middleware-rewrite')).toContain('/app/dev')
    } finally {
      vi.unstubAllEnvs()
    }
  })

  it('explicitly matches dotted guest paths despite the static-asset exclusion', () => {
    expect(config.matcher).toContain('/e/:path*')
  })
})
