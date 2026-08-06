import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { Resend } from 'resend'
import { buildInviteEmail } from '@/lib/email/inviteEmail'
import { getAppBaseUrl } from '@/lib/url'

const uuidSchema = z.string().uuid()

const postSchema = z.object({
  email: z.string().email().max(320),
  role:  z.enum(['co-host', 'planner', 'photographer', 'viewer']).default('co-host'),
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
      .select('id, name')
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

    // Insert and return the new row's id (used as the invite token)
    const { data: newCollab, error } = await supabase
      .from('event_collaborators')
      .insert({
        event_id:      id,
        invited_email: email.toLowerCase().trim(),
        role,
        status:        'pending',
      })
      .select('id')
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'This person is already invited' }, { status: 409 })
      }
      console.error('POST /api/events/[id]/admins failed:', error)
      return NextResponse.json({ error: 'Failed to invite collaborator' }, { status: 500 })
    }

    // Fetch the owner's display name for the email
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('display_name')
      .eq('id', user.id)
      .single()

    const ownerName  = profile?.display_name?.trim() || user.email?.split('@')[0] || 'The host'
    const eventName  = ev.name ?? 'your event'
    const inviteUrl  = `${getAppBaseUrl()}/auth/accept-invite?token=${newCollab.id}`

    // Send invite email — best-effort, never fail the request
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from:    process.env.RESEND_FROM_EMAIL ?? 'Evenzi <onboarding@resend.dev>',
          to:      email,
          subject: `${ownerName} invited you to co-host ${eventName} on Evenzi`,
          html:    buildInviteEmail({ ownerName, eventName, role, inviteUrl }),
        })
      } catch (emailErr) {
        console.error('[admins] Failed to send invite email:', emailErr)
      }
    } else {
      console.warn('[admins] RESEND_API_KEY not set — invite saved but email not sent. Accept URL:', inviteUrl)
    }

    return NextResponse.json({ success: true, id: newCollab.id }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
