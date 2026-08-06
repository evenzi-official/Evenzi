import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireEventWrite } from '@/lib/auth/eventAccess'

const uuidSchema = z.string().uuid()

// Deliberately excludes 'owner' — owner identity lives only on events.user_id (D16),
// never on an event_collaborators row. This is the app-layer half of closing the
// self-escalation bug the council found; Task 13's CHECK constraint is the DB-layer half.
const patchSchema = z.object({
  role: z.enum(['co-host', 'planner', 'photographer', 'viewer']),
}).strict()

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; collaboratorId: string }> }
): Promise<NextResponse> {
  try {
    const { id, collaboratorId } = await params
    if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(collaboratorId).success) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const access = await requireEventWrite(supabase, id, user.id, 'admins')
    if (!access.ok) return access.response

    // Lockout guard: a co-host must not remove their own access mid-session.
    const { data: target } = await supabase
      .from('event_collaborators')
      .select('user_id')
      .eq('id', collaboratorId)
      .eq('event_id', id)
      .single()
    if (target?.user_id && target.user_id === user.id) {
      return NextResponse.json({ error: "You can't remove your own access" }, { status: 400 })
    }

    const { error } = await supabase
      .from('event_collaborators')
      .delete()
      .eq('id', collaboratorId)
      .eq('event_id', id)

    if (error) {
      console.error('DELETE /api/events/[id]/admins/[collaboratorId] failed:', error)
      return NextResponse.json({ error: 'Failed to remove collaborator' }, { status: 500 })
    }

    return new NextResponse(null, { status: 204 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; collaboratorId: string }> }
): Promise<NextResponse> {
  try {
    const { id, collaboratorId } = await params
    if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(collaboratorId).success) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const access = await requireEventWrite(supabase, id, user.id, 'admins')
    if (!access.ok) return access.response

    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    // Lockout guard: a co-host must not demote themselves out of admins mid-session.
    const { data: target } = await supabase
      .from('event_collaborators')
      .select('user_id')
      .eq('id', collaboratorId)
      .eq('event_id', id)
      .single()
    if (target?.user_id && target.user_id === user.id) {
      return NextResponse.json({ error: "You can't change your own role" }, { status: 400 })
    }

    const { error } = await supabase
      .from('event_collaborators')
      .update({ role: parsed.data.role })
      .eq('id', collaboratorId)
      .eq('event_id', id)

    if (error) {
      console.error('PATCH /api/events/[id]/admins/[collaboratorId] failed:', error)
      return NextResponse.json({ error: 'Failed to update role' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
