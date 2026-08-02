import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { COOKIE_NAME, mapRpcError, clearSessionCookie } from '../_lib'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  try {
    const { slug } = await params
    if (!slug || slug.length > 200) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value

    if (!token) {
      return NextResponse.json({ error: 'Session expired — please identify yourself again' }, { status: 401 })
    }

    const supabase = await createClient()

    const [sessionResult, payloadResult] = await Promise.all([
      supabase.rpc('resolve_guest_session', { p_token: token }),
      supabase.rpc('get_guest_website_payload', { p_session_token: token }),
    ])

    if (sessionResult.error || payloadResult.error) {
      const err = sessionResult.error ?? payloadResult.error!
      const mapped = mapRpcError(err.message)
      if (mapped.status === 500) {
        console.error('GET /api/e/[slug]/guest rpc error:', err)
      }
      const response = NextResponse.json({ error: mapped.body }, { status: mapped.status })
      if (err.message === 'invalid session') clearSessionCookie(response)
      return response
    }

    if (!sessionResult.data || !payloadResult.data) {
      const response = NextResponse.json({ error: 'Session expired — please identify yourself again' }, { status: 401 })
      clearSessionCookie(response)
      return response
    }

    return NextResponse.json({
      guest: sessionResult.data,
      payload: payloadResult.data,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
