import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { updateExpenseSchema, uuidSchema } from '@/lib/validations/planning'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; expenseId: string }> }
): Promise<NextResponse> {
  try {
    const { id, expenseId } = await params
    if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(expenseId).success) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = updateExpenseSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const { amount, expenseTypeId, vendorName, subEventId, expenseDate, description } = parsed.data

    const patch: Record<string, unknown> = {}
    if (amount !== undefined) patch.amount = amount
    if (expenseTypeId !== undefined) patch.expense_type_id = expenseTypeId
    if (vendorName !== undefined) patch.vendor_name = vendorName
    if (subEventId !== undefined) patch.sub_event_id = subEventId
    if (expenseDate !== undefined) patch.expense_date = expenseDate
    if (description !== undefined) patch.description = description

    const expenseColumns = 'id, amount, expense_type_id, vendor_name, sub_event_id, expense_date, description'
    let expenseRow: {
      id: string
      amount: number
      expense_type_id: string
      vendor_name: string | null
      sub_event_id: string | null
      expense_date: string | null
      description: string | null
    } | null = null

    if (Object.keys(patch).length > 0) {
      const { data: updatedRows, error: updateError } = await supabase
        .from('event_expenses')
        .update(patch)
        .eq('id', expenseId)
        .eq('event_id', id)
        .select(expenseColumns)

      if (updateError) {
        console.error('PATCH /api/events/[id]/planning/expenses/[expenseId] failed:', updateError)
        return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 })
      }
      if (!updatedRows || updatedRows.length === 0) {
        return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
      }
      expenseRow = updatedRows[0]
    } else {
      const { data: existingRow, error: fetchError } = await supabase
        .from('event_expenses')
        .select(expenseColumns)
        .eq('id', expenseId)
        .eq('event_id', id)
        .maybeSingle()

      if (fetchError) {
        console.error('PATCH /api/events/[id]/planning/expenses/[expenseId] fetch failed:', fetchError)
        return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 })
      }
      if (!existingRow) {
        return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
      }
      expenseRow = existingRow
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
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; expenseId: string }> }
): Promise<NextResponse> {
  try {
    const { id, expenseId } = await params
    if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(expenseId).success) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: deletedRows, error: deleteError } = await supabase
      .from('event_expenses')
      .delete()
      .eq('id', expenseId)
      .eq('event_id', id)
      .select('id')

    if (deleteError) {
      console.error('DELETE /api/events/[id]/planning/expenses/[expenseId] failed:', deleteError)
      return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 })
    }
    if (!deletedRows || deletedRows.length === 0) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
