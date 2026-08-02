import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { COOKIE_NAME, mapRpcError, clearSessionCookie } from '../_lib'

const rsvpSchema = z.object({
  sub_event_id:    z.string().uuid(),
  response_status: z.enum(['confirmed', 'declined', 'maybe']),
  plus_one_count:  z.number().int().min(0).max(10).optional(),
  dietary_notes:   z.string().max(500).optional(),
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

    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value

    if (!token) {
      return NextResponse.json({ error: 'Session expired — please identify yourself again' }, { status: 401 })
    }

    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = rsvpSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { sub_event_id, response_status, plus_one_count, dietary_notes } = parsed.data

    const supabase = await createClient()
    const { error } = await supabase.rpc('submit_rsvp', {
      p_token:           token,
      p_sub_event_id:    sub_event_id,
      p_response_status: response_status,
      ...(plus_one_count  !== undefined && { p_plus_one_count:  plus_one_count }),
      ...(dietary_notes   !== undefined && { p_dietary_notes:   dietary_notes }),
    })

    if (error) {
      const mapped = mapRpcError(error.message)
      if (mapped.status === 500) {
        console.error('POST /api/e/[slug]/rsvp rpc error:', error)
      }
      const response = NextResponse.json({ error: mapped.body }, { status: mapped.status })
      if (error.message === 'invalid session') clearSessionCookie(response)
      return response
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
