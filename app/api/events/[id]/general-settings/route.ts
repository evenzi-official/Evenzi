import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const uuidSchema = z.string().uuid()

const patchSchema = z.object({
  tagline:          z.string().max(80).nullable().optional(),
  show_on_dashboard: z.boolean().optional(),
  discoverable:     z.boolean().optional(),
}).strict()

function nullify(v: string | null | undefined): string | null | undefined {
  if (v === undefined) return undefined
  if (v === null) return null
  return v.trim() === '' ? null : v
}

async function verifyOwnership(supabase: Awaited<ReturnType<typeof createClient>>, eventId: string, userId: string) {
  const { data } = await supabase
    .from('events')
    .select('id')
    .eq('id', eventId)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .single()
  return !!data
}

export async function PATCH(
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

    if (!await verifyOwnership(supabase, id, user.id)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { tagline, show_on_dashboard, discoverable } = parsed.data

    const upsertData: Record<string, unknown> = { event_id: id, user_id: user.id }
    if (tagline !== undefined) upsertData.tagline = nullify(tagline)
    if (show_on_dashboard !== undefined) upsertData.show_on_dashboard = show_on_dashboard
    if (discoverable !== undefined) upsertData.discoverable = discoverable

    const { error } = await supabase
      .from('event_general_settings')
      .upsert(upsertData, { onConflict: 'event_id' })

    if (error) {
      console.error('PATCH /api/events/[id]/general-settings failed:', error)
      return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
