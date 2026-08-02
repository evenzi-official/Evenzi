import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const uuidSchema = z.string().uuid()

type ConfigPage = {
  id: string
  slug: string
  name: string
  icon_name: string | null
  tier: string
  display_order: number
}

const reorderSchema = z.object({
  order: z.array(z.object({ id: z.string().uuid(), display_order: z.number().int().min(0) })).min(1),
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

    if (!await verifyOwnership(supabase, id, user.id)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const [pagesResult, configResult] = await Promise.all([
      supabase
        .from('event_website_pages')
        .select('id, page_id, is_visible, custom_title, display_order')
        .eq('event_id', id)
        .order('display_order'),
      supabase
        .schema('config')
        .from('website_pages')
        .select('id, slug, name, icon_name, tier, display_order') as unknown as Promise<{ data: ConfigPage[] | null; error: unknown }>,
    ])

    if (pagesResult.error) {
      console.error('GET /api/events/[id]/website-pages pages query failed:', pagesResult.error)
      return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 })
    }

    const configMap = new Map<string, ConfigPage>()
    if (configResult.data) {
      for (const p of configResult.data) configMap.set(p.id, p)
    }

    const pages = (pagesResult.data ?? []).map((p) => {
      const cfg = configMap.get(p.page_id)
      return {
        id: p.id,
        page_id: p.page_id,
        slug: cfg?.slug ?? p.page_id,
        label: p.custom_title ?? cfg?.name ?? 'Page',
        icon: cfg?.icon_name ?? 'web',
        tier: cfg?.tier ?? 'public',
        is_visible: p.is_visible,
        custom_title: p.custom_title,
        display_order: p.display_order,
      }
    })

    return NextResponse.json({ pages })
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

    if (!await verifyOwnership(supabase, id, user.id)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = reorderSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const updates = parsed.data.order.map(({ id: rowId, display_order }) =>
      supabase
        .from('event_website_pages')
        .update({ display_order, updated_at: new Date().toISOString() })
        .eq('id', rowId)
        .eq('event_id', id)
    )
    const results = await Promise.all(updates)
    const failed = results.find((r) => r.error)
    if (failed?.error) {
      console.error('PATCH /api/events/[id]/website-pages reorder failed:', failed.error)
      return NextResponse.json({ error: 'Failed to reorder pages' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
