import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { upsertBudgetSchema, uuidSchema } from '@/lib/validations/planning'

export async function PUT(
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

    const parsed = upsertBudgetSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { error: upsertError } = await supabase
      .from('event_budgets')
      .upsert(
        { event_id: id, total_amount: parsed.data.totalAmount, modified_by: user.id },
        { onConflict: 'event_id' }
      )

    if (upsertError) {
      console.error('PUT /api/events/[id]/planning/budget failed:', upsertError)
      return NextResponse.json({ error: 'Failed to save budget' }, { status: 500 })
    }

    const { data: summary } = await supabase
      .from('event_budget_summary').select('total_amount, spent, remaining').eq('event_id', id).single()

    return NextResponse.json({
      budget: summary ? { totalAmount: summary.total_amount, spent: summary.spent, remaining: summary.remaining } : null,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
