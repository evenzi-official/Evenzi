import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireEventWrite } from '@/lib/auth/eventAccess'
import { z } from 'zod'

const uuidSchema = z.string().uuid()
const patchSchema = z.object({ show_on_website: z.boolean() }).strict()

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; subId: string }> }
): Promise<NextResponse> {
  try {
    const { id, subId } = await params
    if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(subId).success) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // show_on_website is a website capability (co-host + owner)
    const access = await requireEventWrite(supabase, id, user.id, 'website')
    if (!access.ok) return access.response

    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('event_sub_events')
      .update({ show_on_website: parsed.data.show_on_website, updated_at: new Date().toISOString() })
      .eq('id', subId)
      .eq('event_id', id)
      .select('id, show_on_website')
      .single()

    if (error || !data) {
      console.error('PATCH /api/events/[id]/sub-events/[subId]:', error)
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
