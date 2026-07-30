import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createExpenseSchema, uuidSchema } from '@/lib/validations/planning'

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

    const parsed = createExpenseSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const { amount, expenseTypeId, vendorName, subEventId, expenseDate, description } = parsed.data

    const { data: expenseRow, error: insertError } = await supabase
      .from('event_expenses')
      .insert({
        event_id: id,
        expense_type_id: expenseTypeId,
        amount,
        vendor_name: vendorName ?? null,
        sub_event_id: subEventId ?? null,
        expense_date: expenseDate ?? null,
        description: description ?? null,
        created_by: user.id,
      })
      .select('id, amount, expense_type_id, vendor_name, sub_event_id, expense_date, description')
      .single()

    if (insertError || !expenseRow) {
      console.error('POST /api/events/[id]/planning/expenses failed:', insertError)
      return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 })
    }

    return NextResponse.json({
      expense: {
        id: expenseRow.id,
        amount: expenseRow.amount,
        expenseTypeId: expenseRow.expense_type_id,
        vendorName: expenseRow.vendor_name,
        subEventId: expenseRow.sub_event_id,
        expenseDate: expenseRow.expense_date,
        description: expenseRow.description,
      },
    }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
