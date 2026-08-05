import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { PW_COOKIE_NAME, PW_COOKIE_MAX_AGE, mapRpcError } from '../_lib'

const verifySchema = z.object({
  password: z.string().min(1).max(100),
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

    const parsed = verifySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { password } = parsed.data

    const forwardedFor = request.headers.get('x-forwarded-for')
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown'

    const supabase = await createClient()
    const { data: token, error } = await supabase
      .rpc('verify_website_password', { p_slug: slug, p_password: password })
      .setHeader('x-forwarded-for', clientIp)

    if (error) {
      const mapped = mapRpcError(error.message)
      if (mapped.status === 500) {
        console.error('POST /api/e/[slug]/verify-password rpc error:', error)
      }
      return NextResponse.json({ error: mapped.body }, { status: mapped.status })
    }

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
    }

    const response = NextResponse.json({ success: true })
    response.cookies.set(PW_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: PW_COOKIE_MAX_AGE,
    })
    return response
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
