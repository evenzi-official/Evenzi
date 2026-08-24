import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { requireEventRead, requireEventWrite } from '@/lib/auth/eventAccess'
import { invitationPatchSchema, uuidSchema } from '@/lib/validations/invitations'
import { fetchDefaultCard, slotsToColumns } from '@/lib/invitations/card'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
    }
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const access = await requireEventRead(supabase, id, user.id, 'invitations')
    if (!access.ok) return access.response

    const card = await fetchDefaultCard(supabase, id)
    const { data: templates, error: tErr } = await supabase
      .schema('config').from('invitation_templates')
      .select('id, slug').eq('enabled', true).order('display_order')
    if (tErr) throw tErr

    return NextResponse.json({ card: card ?? null, templates: templates ?? [] })
  } catch (err) {
    console.error('GET /api/events/[id]/invitation-card failed:', err)
    return NextResponse.json({ error: 'Failed to fetch card' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
    }
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const access = await requireEventWrite(supabase, id, user.id, 'invitations')
    if (!access.ok) return access.response

    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
    const parsed = invitationPatchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const d = parsed.data

    // Build the column patch, enforcing the dual-mode invariant.
    const patch: Record<string, unknown> = { updated_by: user.id, updated_at: new Date().toISOString() }
    if (d.template_id !== undefined) {
      patch.template_id = d.template_id
      if (d.template_id !== null) patch.card_upload_key = null   // template mode nulls upload
    }
    if (d.card_upload_key !== undefined) {
      patch.card_upload_key = d.card_upload_key
      if (d.card_upload_key !== null) patch.template_id = null   // upload mode nulls template
    }
    if (d.photo_bg_key !== undefined) patch.photo_bg_key = d.photo_bg_key
    if (d.slot_sizes !== undefined) patch.slot_sizes = d.slot_sizes
    if (d.is_custom !== undefined) patch.is_custom = d.is_custom
    if (d.slots) Object.assign(patch, slotsToColumns(d.slots))

    // Ensure the default card exists (lazy seed for legacy events), then update it.
    const existing = await fetchDefaultCard(supabase, id)
    if (!existing) {
      return NextResponse.json({ error: 'No invitation card for this event' }, { status: 404 })
    }
    const { error } = await supabase
      .from('event_invitation_cards')
      .update(patch)
      .eq('id', (existing as unknown as { id: string }).id)
    if (error) {
      console.error('PATCH /api/events/[id]/invitation-card update failed:', error)
      return NextResponse.json({ error: 'Failed to save card' }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('PATCH /api/events/[id]/invitation-card failed:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
