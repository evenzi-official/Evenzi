import { createClient } from '@/lib/supabase/server'
import { runInviteActionByEvent } from '@/lib/collaborators/inviteRpc'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const uuidSchema = z.string().uuid()

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> },
): Promise<NextResponse> {
  try {
    const { eventId } = await params
    if (!uuidSchema.safeParse(eventId).success) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return runInviteActionByEvent(supabase, eventId, 'accept')
  } catch (err) {
    console.error('POST /api/collaborators/invites/by-event/[eventId]/accept failed:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
