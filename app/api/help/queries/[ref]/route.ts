import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { queryOutcomeSchema } from '@/lib/validations/help'

const REF_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function PATCH(
  request: Request,
  context: { params: Promise<{ ref: string }> }
): Promise<NextResponse> {
  try {
    const { ref } = await context.params
    if (!REF_UUID.test(ref)) {
      return NextResponse.json({ error: 'Invalid reference' }, { status: 400 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = queryOutcomeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 })
    }

    // Update nothing but resolved / escalated, keyed on ref only — never id.
    // Spec §5.5 / §8.6.
    const patch: { resolved?: boolean; escalated?: boolean } = {}
    if (parsed.data.resolved !== undefined) patch.resolved = parsed.data.resolved
    if (parsed.data.escalated !== undefined) patch.escalated = parsed.data.escalated

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 })
    }

    const service = createServiceClient()
    const { data, error } = await service
      .from('help_queries')
      .update(patch)
      .eq('ref', ref)
      .select('ref')
      .maybeSingle()

    if (error) {
      console.error('PATCH /api/help/queries/[ref] failed:', error.message)
      return NextResponse.json({ error: 'Could not update query' }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
