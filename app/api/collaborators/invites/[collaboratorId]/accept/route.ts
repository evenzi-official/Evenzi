import { createClient } from '@/lib/supabase/server'
import { runInviteAction } from '@/lib/collaborators/inviteRpc'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const uuidSchema = z.string().uuid()

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ collaboratorId: string }> },
): Promise<NextResponse> {
  try {
    const { collaboratorId } = await params
    if (!uuidSchema.safeParse(collaboratorId).success) {
      return NextResponse.json({ error: 'Invalid invite ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return runInviteAction(supabase, collaboratorId, 'accept')
  } catch (err) {
    console.error('POST /api/collaborators/invites/[collaboratorId]/accept failed:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
