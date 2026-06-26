import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const uuidSchema = z.string().uuid()

const postSchema = z.object({
  email: z.string().email().max(320),
  role:  z.string().max(50).default('co-host'),
}).strict()

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify caller owns this event
    const { data: ev } = await supabase
      .from('events')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()
    if (!ev) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = postSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { email, role } = parsed.data

    const { error } = await supabase
      .from('event_collaborators')
      .insert({
        event_id:      id,
        invited_email: email.toLowerCase().trim(),
        role,
        status:        'pending',
      })

    if (error) {
      if (error.code === '23505') { // unique violation
        return NextResponse.json({ error: 'This person is already invited' }, { status: 409 })
      }
      console.error('POST /api/events/[id]/admins failed:', error)
      return NextResponse.json({ error: 'Failed to invite collaborator' }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
