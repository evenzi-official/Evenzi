import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getUserProfile } from '@/lib/supabase/profile'
import { isEnvMissingPublicPath, isPublicPath } from '@/lib/supabase/is-public-path'
import type { Surface } from '@/lib/surface'

export function parseAdminUserIds(value = process.env.ADMIN_USER_IDS): Set<string> {
  return new Set(
    (value ?? '')
      .split(',')
      .map((id) => id.trim().toLowerCase())
      .filter(Boolean),
  )
}

function withSessionCookies(source: NextResponse, target: NextResponse): NextResponse {
  source.cookies.getAll().forEach((cookie) => target.cookies.set(cookie))
  return target
}

function redirectWithSessionCookies(source: NextResponse, url: URL): NextResponse {
  return withSessionCookies(source, NextResponse.redirect(url))
}

export async function updateSession(
  request: NextRequest,
  surface: Surface = 'app',
  canonicalPathname = request.nextUrl.pathname,
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY

  if (surface === 'marketing') {
    return NextResponse.next({ request })
  }

  // If env vars are missing, allow access to public routes only
  if (!supabaseUrl || !supabaseKey) {
    if (surface === 'admin') {
      return new NextResponse('Forbidden', { status: 403 })
    }
    if (surface === 'app' && canonicalPathname === '/') {
      const url = request.nextUrl.clone()
      url.pathname = '/auth'
      return NextResponse.redirect(url)
    }
    if (isEnvMissingPublicPath(canonicalPathname)) {
      return NextResponse.next()
    }
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    url.searchParams.set('error', 'env_missing')
    return NextResponse.redirect(url)
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          supabaseResponse.cookies.set(name, value, options as any)
        )
      },
    },
  })

  // IMPORTANT: Do not add logic between createServerClient and getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = canonicalPathname
  const isAdminAuthPath = pathname === '/auth' || pathname.startsWith('/auth/')

  if (surface === 'admin' && !isAdminAuthPath) {
    // TODO(admin-rbac): replace env allowlist with role_slug='admin' + RLS (next session)
    const adminUserIds = parseAdminUserIds()
    if (!user || !adminUserIds.has(user.id.toLowerCase())) {
      return withSessionCookies(supabaseResponse, new NextResponse('Forbidden', { status: 403 }))
    }
  }

  if (surface === 'app' && pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = user ? '/home' : '/auth'
    return redirectWithSessionCookies(supabaseResponse, url)
  }

  if (surface === 'admin' && pathname === '/home') {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return redirectWithSessionCookies(supabaseResponse, url)
  }

  // Dev-only playground (e.g. /dev/r2-test) — accessible without auth in development only.
  const isDevPlayground =
    process.env.NODE_ENV !== 'production' && pathname.startsWith('/dev')

  // Public paths — no auth required (/help exact-plus-prefix; /helpdesk stays protected)
  const pathIsPublic = isPublicPath(pathname) || isDevPlayground

  // No user on non-public path → redirect to auth
  if (!user && !pathIsPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    return redirectWithSessionCookies(supabaseResponse, url)
  }

  // User exists — check role for routing decisions
  if (user) {
    const profile = await getUserProfile(supabase, user.id)
    const hasRole = profile?.role_slug != null

    // User with no role trying to access protected routes → role selection
    if (!hasRole && pathname !== '/auth/role-selection' && !pathIsPublic) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/role-selection'
      return redirectWithSessionCookies(supabaseResponse, url)
    }

    // User with role on role-selection page → redirect to dashboard
    if (hasRole && pathname === '/auth/role-selection') {
      const url = request.nextUrl.clone()
      url.pathname = '/home'
      return redirectWithSessionCookies(supabaseResponse, url)
    }

    // User with role on auth page → redirect to dashboard
    if (hasRole && pathname === '/auth') {
      const url = request.nextUrl.clone()
      url.pathname = '/home'
      return redirectWithSessionCookies(supabaseResponse, url)
    }

    // Host-only routes — vendors cannot access event creation/management
    if (hasRole && profile?.role_slug !== 'host' && pathname.startsWith('/events')) {
      const url = request.nextUrl.clone()
      url.pathname = '/home'
      return redirectWithSessionCookies(supabaseResponse, url)
    }
  }

  return supabaseResponse
}
