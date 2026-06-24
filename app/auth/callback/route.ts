import { createServerClient } from '@supabase/ssr'
import { getUserProfile } from '@/lib/supabase/profile'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/auth?error=auth_failed`)
  }

  // Prepare redirect response — session cookies will be set on it
  const response = NextResponse.redirect(`${origin}/auth/role-selection`, { status: 302 })

  // Now using @supabase/ssr v0.10.0 with getAll/setAll API
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('OAuth callback error:', error.message)
    return NextResponse.redirect(`${origin}/auth?error=auth_failed`)
  }

  if (data.user) {
    const profile = await getUserProfile(supabase, data.user.id)
    const redirectPath = profile?.role_slug ? '/home' : '/auth/role-selection'

    // Update redirect location — cookies are already set on `response`
    response.headers.set('location', `${origin}${redirectPath}`)
    return response
  }

  return NextResponse.redirect(`${origin}/auth?error=auth_failed`)
}
