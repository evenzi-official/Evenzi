import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { COOKIE_NAME, COOKIE_MAX_AGE, PW_COOKIE_NAME, mapRpcError } from '../_lib'

const lookupSchema = z.object({
  phone: z.string().min(5).max(20),
  name:  z.string().min(1).max(100),
}).strict()

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  try {
    const { slug } = await params
    if (!slug || slug.length > 200) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = lookupSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { phone, name } = parsed.data

    const forwardedFor = request.headers.get('x-forwarded-for')
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown'

    const supabase = await createClient()

    // Match guest page gate: password-protected sites require evz_site_pw before lookup.
    const { data: rawPayload, error: payloadError } = await supabase.rpc(
      'get_public_website_payload',
      { p_slug: slug }
    )
    if (payloadError || rawPayload === null) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const payload = rawPayload as { password_enabled?: boolean }
    if (payload.password_enabled) {
      const cookieStore = await cookies()
      const pwToken = cookieStore.get(PW_COOKIE_NAME)?.value ?? null
      const { data: pwVerified } = await supabase.rpc('is_website_password_verified', {
        p_slug: slug,
        p_token: pwToken,
      })
      if (!pwVerified) {
        return NextResponse.json({ error: 'Password required' }, { status: 401 })
      }
    }

    const { data: token, error } = await supabase
      .rpc('resolve_guest_by_lookup', { p_slug: slug, p_phone: phone, p_name: name })
      .setHeader('x-forwarded-for', clientIp)

    if (error) {
      const mapped = mapRpcError(error.message)
      if (mapped.status === 500) {
        console.error('POST /api/e/[slug]/lookup rpc error:', error)
      }
      return NextResponse.json({ error: mapped.body }, { status: mapped.status })
    }

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'No matching guest found' }, { status: 401 })
    }

    const response = NextResponse.json({ success: true })
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: COOKIE_MAX_AGE,
    })
    return response
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
