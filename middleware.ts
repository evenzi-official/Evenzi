import { type NextRequest } from 'next/server'
import { updateSession } from './lib/supabase/middleware'

const APP_ROUTE_PREFIXES = [
  '/home',
  '/events',
  '/settings',
  '/auth',
  '/help',
  '/wedding-invitation-temp-1',
]

function getPass1RewritePath(pathname: string): string | null {
  if (pathname === '/') return '/marketing'

  if (pathname === '/legal' || pathname.startsWith('/legal/')) {
    return `/marketing${pathname}`
  }

  if (APP_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return `/app${pathname}`
  }

  // app/dev stays at its original path because the development playground
  // remains outside the surface folders for this pass.
  return null
}

export async function middleware(request: NextRequest) {
  const response = await updateSession(request)

  // Pass 1 compatibility: keep the pre-split public URLs while the physical
  // route folders live under /app and /marketing. This is path-only; host
  // resolution and surface routing are deferred to Pass 2.
  if (response.status >= 300 && response.status < 400) return response

  const targetPath = getPass1RewritePath(request.nextUrl.pathname)
  if (!targetPath) return response

  const rewriteUrl = request.nextUrl.clone()
  rewriteUrl.pathname = targetPath
  response.headers.set('x-middleware-rewrite', rewriteUrl.toString())
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    // sw.js + web manifest must stay public (Push SW / Add to Home Screen)
    '/((?!_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm|glb|gltf|obj|ico|txt|xml|webmanifest)$).*)',
  ],
}

