import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const uuidSchema = z.string().uuid()

const patchSchema = z.object({
  website_password_enabled:    z.boolean().optional(),
  search_indexing_enabled:     z.boolean().optional(),
  announcement_banner_enabled: z.boolean().optional(),
  announcement_banner_text:    z.string().max(160).nullable().optional(),
  site_offline:                z.boolean().optional(),
}).strict()

function nullify(v: string | null | undefined): string | null | undefined {
  if (v === undefined) return undefined
  if (v === null) return null
  return v.trim() === '' ? null : v
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

    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const {
      website_password_enabled,
      search_indexing_enabled,
      announcement_banner_enabled,
      announcement_banner_text,
      site_offline,
    } = parsed.data

    const upsertData: Record<string, unknown> = { event_id: id, user_id: user.id }
    if (website_password_enabled !== undefined) upsertData.website_password_enabled = website_password_enabled
    if (search_indexing_enabled !== undefined) upsertData.search_indexing_enabled = search_indexing_enabled
    if (announcement_banner_enabled !== undefined) upsertData.announcement_banner_enabled = announcement_banner_enabled
    if (announcement_banner_text !== undefined) upsertData.announcement_banner_text = nullify(announcement_banner_text)
    if (site_offline !== undefined) upsertData.site_offline = site_offline

    const { error } = await supabase
      .from('event_website_settings')
      .upsert(upsertData, { onConflict: 'event_id' })

    if (error) {
      console.error('PATCH /api/events/[id]/website-settings failed:', error)
      return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
