import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { requireEventWrite, requireEventRead } from '@/lib/auth/eventAccess'
import { z } from 'zod'

const uuidSchema = z.string().uuid()

const patchSchema = z.object({
  template_id:     z.string().max(100).nullable().optional(),
  palette_id:      z.string().uuid().nullable().optional(),
  heading_font_id: z.string().uuid().nullable().optional(),
  body_font_id:    z.string().uuid().nullable().optional(),
  cover_image_key: z.string().max(512).nullable().optional(),
  og_image_key:    z.string().max(512).nullable().optional(),
}).strict()


export async function GET(
  _request: Request,
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

    const access = await requireEventRead(supabase, id, user.id, 'website')
    if (!access.ok) return access.response

    const { data, error } = await supabase
      .from('event_website_design')
      .select('template_id, palette_id, heading_font_id, body_font_id, cover_image_key, og_image_key')
      .eq('event_id', id)
      .maybeSingle()

    if (error) {
      console.error('GET /api/events/[id]/website-design failed:', error)
      return NextResponse.json({ error: 'Failed to fetch design' }, { status: 500 })
    }

    return NextResponse.json({ design: data ?? null })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
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

    const access = await requireEventWrite(supabase, id, user.id, 'website')
    if (!access.ok) return access.response

    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const upsertData: Record<string, unknown> = {
      event_id: id,
      user_id: user.id,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    }
    for (const [k, v] of Object.entries(parsed.data)) {
      if (v !== undefined) upsertData[k] = v
    }

    const { error } = await supabase
      .from('event_website_design')
      .upsert(upsertData, { onConflict: 'event_id' })

    if (error) {
      console.error('PATCH /api/events/[id]/website-design failed:', error)
      return NextResponse.json({ error: 'Failed to save design' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
