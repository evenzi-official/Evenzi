import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { requireEventWrite } from '@/lib/auth/eventAccess'
import { updateTaskSchema, uuidSchema } from '@/lib/validations/planning'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> }
): Promise<NextResponse> {
  try {
    const { id, taskId } = await params
    if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(taskId).success) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const access = await requireEventWrite(supabase, id, user.id, 'planning')
    if (!access.ok) return access.response

    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = updateTaskSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const { title, description, dueDate, subEventId, priorityId, statusId } = parsed.data

    const patch: Record<string, unknown> = {}
    if (title !== undefined) patch.title = title
    if (description !== undefined) patch.description = description
    if (dueDate !== undefined) patch.due_date = dueDate
    if (subEventId !== undefined) patch.sub_event_id = subEventId
    if (priorityId !== undefined) patch.priority_id = priorityId
    if (statusId !== undefined) patch.status_id = statusId

    const taskColumns = 'id, title, description, due_date, sub_event_id, priority_id, status_id'
    let taskRow: {
      id: string
      title: string
      description: string | null
      due_date: string | null
      sub_event_id: string | null
      priority_id: string
      status_id: string
    } | null = null

    if (Object.keys(patch).length > 0) {
      const { data: updatedRows, error: updateError } = await supabase
        .from('event_tasks')
        .update(patch)
        .eq('id', taskId)
        .eq('event_id', id)
        .select(taskColumns)

      if (updateError) {
        console.error('PATCH /api/events/[id]/planning/tasks/[taskId] failed:', updateError)
        return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
      }
      if (!updatedRows || updatedRows.length === 0) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 })
      }
      taskRow = updatedRows[0]
    } else {
      const { data: existingRow, error: fetchError } = await supabase
        .from('event_tasks')
        .select(taskColumns)
        .eq('id', taskId)
        .eq('event_id', id)
        .maybeSingle()

      if (fetchError) {
        console.error('PATCH /api/events/[id]/planning/tasks/[taskId] fetch failed:', fetchError)
        return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
      }
      if (!existingRow) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 })
      }
      taskRow = existingRow
    }

    return NextResponse.json({
      task: {
        id: taskRow.id,
        title: taskRow.title,
        description: taskRow.description,
        dueDate: taskRow.due_date,
        subEventId: taskRow.sub_event_id,
        priorityId: taskRow.priority_id,
        statusId: taskRow.status_id,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> }
): Promise<NextResponse> {
  try {
    const { id, taskId } = await params
    if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(taskId).success) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const access = await requireEventWrite(supabase, id, user.id, 'planning')
    if (!access.ok) return access.response

    const { data: deletedRows, error: deleteError } = await supabase
      .from('event_tasks')
      .delete()
      .eq('id', taskId)
      .eq('event_id', id)
      .select('id')

    if (deleteError) {
      console.error('DELETE /api/events/[id]/planning/tasks/[taskId] failed:', deleteError)
      return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
    }
    if (!deletedRows || deletedRows.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
