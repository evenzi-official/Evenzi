import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getUserProfile } from '@/lib/supabase/profile'

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY

  // If env vars are missing, allow access to public routes only
  if (!supabaseUrl || !supabaseKey) {
    const pathname = request.nextUrl.pathname
    if (
      pathname === '/' ||
      pathname.startsWith('/auth') ||
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api')
    ) {
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

  const pathname = request.nextUrl.pathname

  // Public paths — no auth required
  const isPublicPath =
    pathname === '/' ||
    pathname === '/auth' ||
    pathname.startsWith('/auth/callback') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api')

  // No user on non-public path → redirect to auth
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    return NextResponse.redirect(url)
  }

  // User exists — check role for routing decisions
  if (user) {
    const profile = await getUserProfile(supabase, user.id)
    const hasRole = profile?.role != null

    // User with no role trying to access protected routes → role selection
    if (!hasRole && pathname !== '/auth/role-selection' && !isPublicPath) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/role-selection'
      return NextResponse.redirect(url)
    }

    // User with role on role-selection page → redirect to dashboard
    if (hasRole && pathname === '/auth/role-selection') {
      const url = request.nextUrl.clone()
      url.pathname = '/home'
      return NextResponse.redirect(url)
    }

    // User with role on auth page → redirect to dashboard
    if (hasRole && pathname === '/auth') {
      const url = request.nextUrl.clone()
      url.pathname = '/home'
      return NextResponse.redirect(url)
    }

    // Host-only routes — vendors cannot access event creation/management
    if (hasRole && profile?.role !== 'host' && pathname.startsWith('/events')) {
      const url = request.nextUrl.clone()
      url.pathname = '/home'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
