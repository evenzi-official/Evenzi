import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const uuidSchema = z.string().uuid()

const patchSchema = z.object({
  is_visible:   z.boolean().optional(),
  custom_title: z.string().max(100).nullable().optional(),
}).strict()

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
  { params }: { params: Promise<{ id: string; pageId: string }> }
): Promise<NextResponse> {
  try {
    const { id, pageId } = await params
    if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(pageId).success) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
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

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (parsed.data.is_visible !== undefined) updateData.is_visible = parsed.data.is_visible
    if (parsed.data.custom_title !== undefined) {
      updateData.custom_title = parsed.data.custom_title?.trim() || null
    }

    const { data, error } = await supabase
      .from('event_website_pages')
      .update(updateData)
      .eq('id', pageId)
      .eq('event_id', id)
      .select('id, is_visible, custom_title, display_order')
      .single()

    if (error) {
      console.error('PATCH /api/events/[id]/website-pages/[pageId] failed:', error)
      return NextResponse.json({ error: 'Failed to update page' }, { status: 500 })
    }
    if (!data) return NextResponse.json({ error: 'Page not found' }, { status: 404 })

    return NextResponse.json({ page: data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
