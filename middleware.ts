import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from './lib/supabase/middleware'
import {
  isSurfacePrefixed,
  normalizePathname,
  resolveSurface,
  type Surface,
} from './lib/surface'

const APP_BRANDED_ASSETS = new Set([
  '/icon.png',
  '/apple-icon.png',
  '/icon.svg',
  '/app/icon.png',
  '/app/apple-icon.png',
  '/app/icon.svg',
])

function isSharedPath(pathname: string): boolean {
  return (
    pathname.startsWith('/api/') ||
    pathname === '/api' ||
    pathname.startsWith('/_next/') ||
    pathname === '/_next' ||
    (process.env.NODE_ENV !== 'production' &&
      (pathname === '/dev' || pathname.startsWith('/dev/')))
  )
}

function internalPathFor(surface: Surface, pathname: string): string {
  if (surface === 'marketing') return `/marketing${pathname}`
  if (surface === 'admin') {
    const isAdminAuthPath = pathname === '/auth' || pathname.startsWith('/auth/')
    return isAdminAuthPath ? `/app${pathname}` : pathname === '/' ? '/admin' : `/admin${pathname}`
  }
  return `/app${pathname}`
}

function applySurfaceHeaders(
  response: NextResponse,
  surface: Surface,
  pathname?: string,
): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  if (surface === 'admin') {
    const isAdminAuthPath = pathname === '/auth' || pathname?.startsWith('/auth/')
    if (!isAdminAuthPath) {
      // Must stay in sync with the /help CSP in next.config.js. 'unsafe-inline'
      // scripts are required so Next.js App Router's inline hydration bootstrap
      // (and the root layout's theme-guard <script>) can run — a strict
      // default-src 'self' blocks them and white-screens the surface. Google
      // Fonts is allowed for the Material Symbols icon font used by the layout.
      response.headers.set(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
      )
    }
    response.headers.set('X-Frame-Options', 'DENY')
  } else {
    response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  }

  return response
}

export async function middleware(request: NextRequest) {
  const pathname = normalizePathname(request.nextUrl.pathname)
  if (!pathname) {
    return new NextResponse('Not Found', { status: 404 })
  }

  if (APP_BRANDED_ASSETS.has(pathname)) {
    const assetSurface = resolveSurface({
      host: request.headers.get('host'),
      surfaceParam: request.nextUrl.searchParams.get('surface'),
      surfaceHeader: request.headers.get('x-evenzi-surface'),
    })
    if (assetSurface !== 'app') {
      return applySurfaceHeaders(new NextResponse('Not Found', { status: 404 }), assetSurface, pathname)
    }

    const response = applySurfaceHeaders(NextResponse.next({ request }), 'app', pathname)
    if (pathname.startsWith('/app/')) return response

    const rewriteUrl = request.nextUrl.clone()
    rewriteUrl.pathname = `/app${pathname}`
    response.headers.set('x-middleware-rewrite', rewriteUrl.toString())
    return response
  }

  if (isSurfacePrefixed(pathname)) {
    return new NextResponse('Not Found', { status: 404 })
  }

  if (pathname === '/manifest.webmanifest') {
    const manifestSurface = resolveSurface({
      host: request.headers.get('host'),
      surfaceParam: request.nextUrl.searchParams.get('surface'),
      surfaceHeader: request.headers.get('x-evenzi-surface'),
    })
    if (manifestSurface !== 'app') {
      return applySurfaceHeaders(new NextResponse('Not Found', { status: 404 }), manifestSurface, pathname)
    }

    const response = applySurfaceHeaders(NextResponse.next({ request }), 'app', pathname)
    const rewriteUrl = request.nextUrl.clone()
    rewriteUrl.pathname = '/app/manifest.webmanifest'
    response.headers.set('x-middleware-rewrite', rewriteUrl.toString())
    return response
  }

  const surface = resolveSurface({
    host: request.headers.get('host'),
    surfaceParam: request.nextUrl.searchParams.get('surface'),
    surfaceHeader: request.headers.get('x-evenzi-surface'),
  })

  if (pathname.startsWith('/e/')) {
    const response = surface === 'app'
      ? await updateSession(request, 'app', pathname)
      : new NextResponse('Not Found', { status: 404 })
    return applySurfaceHeaders(response, surface, pathname)
  }

  // API routes are host-agnostic and self-gate; future admin APIs must
  // re-check ADMIN_USER_IDS/RBAC in-handler and never trust the Host header.
  if (isSharedPath(pathname)) {
    return await updateSession(request)
  }

  const response = surface === 'marketing'
    ? NextResponse.next({ request })
    : await updateSession(request, surface, pathname)
  applySurfaceHeaders(response, surface, pathname)

  // updateSession returns a terminal response for any non-2xx outcome (auth
  // redirects AND the admin 403 gate). Never rewrite those — a rewrite on a 403
  // would make Next render the target route's body under the 403 status (admin
  // content leak) or turn it into a 404. Only pass-through (2xx) responses get
  // the surface rewrite.
  if (response.status >= 300) return response

  const rewriteUrl = request.nextUrl.clone()
  rewriteUrl.pathname = internalPathFor(surface, pathname)
  // Keep this response object so Supabase Set-Cookie refreshes survive the rewrite.
  // Auth cookies remain host-scoped; do not add Domain=.evenzii.com.
  response.headers.set('x-middleware-rewrite', rewriteUrl.toString())
  return response
}

export const config = {
  matcher: [
    /*
     * Match surface pages and /e/*, excluding host-agnostic APIs and static files.
     * API routes are self-gating and must not trust the Host header for authorization.
     */
    '/((?!api(?:/|$)|_next/static|_next/image|favicon.ico|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm|glb|gltf|obj|ico|txt|xml|webmanifest)$).*)',
    '/manifest.webmanifest',
    '/icon.png',
    '/apple-icon.png',
    '/icon.svg',
    '/e/:path*',
    '/app/icon.png',
    '/app/apple-icon.png',
    '/app/icon.svg',
  ],
}

