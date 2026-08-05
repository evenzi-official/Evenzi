import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const uuidSchema = z.string().uuid()

const patchSchema = z.object({
  website_password_enabled:    z.boolean().optional(),
  website_password:            z.string().min(1).max(100).optional(),
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

    const {
      website_password_enabled,
      website_password,
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

    if (website_password) {
      const { data: hash, error: hashError } = await supabase
        .rpc('hash_website_password', { p_password: website_password })
      if (hashError || !hash) {
        console.error('PATCH /api/events/[id]/website-settings hash failed:', hashError)
        return NextResponse.json({ error: 'Failed to save password' }, { status: 500 })
      }
      upsertData.website_password_hash = hash
    }

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
