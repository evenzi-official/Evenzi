import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createExpenseTypeSchema, uuidSchema } from '@/lib/validations/planning'

export async function POST(
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

    const parsed = createExpenseTypeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { data: typeRow, error: insertError } = await supabase
      .from('event_expense_types')
      .insert({
        event_id: id,
        name: parsed.data.name,
        icon_name: 'more_horiz',
        is_custom: true,
        source_slug: null,
      })
      .select('id, name, icon_name, is_custom')
      .single()

    if (insertError || !typeRow) {
      // unique(event_id, lower(name)) violation → 409, not 500
      const status = insertError?.code === '23505' ? 409 : 500
      console.error('POST /api/events/[id]/planning/expense-types failed:', insertError)
      return NextResponse.json({ error: status === 409 ? 'That type already exists' : 'Failed to create expense type' }, { status })
    }

    return NextResponse.json({
      expenseType: { id: typeRow.id, name: typeRow.name, iconName: typeRow.icon_name, isCustom: typeRow.is_custom },
    }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
