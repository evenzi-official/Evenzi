import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { requireEventWrite } from '@/lib/auth/eventAccess'
import { createTaskSchema, uuidSchema } from '@/lib/validations/planning'

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

    const access = await requireEventWrite(supabase, id, user.id, 'planning')
    if (!access.ok) return access.response

    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = createTaskSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const { title, description, dueDate, subEventId, priorityId } = parsed.data

    const { data: pendingStatus, error: statusError } = await supabase
      .schema('config').from('task_statuses').select('id').eq('slug', 'pending').single()
    if (statusError || !pendingStatus) {
      console.error('POST /api/events/[id]/planning/tasks: pending status lookup failed:', statusError)
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
    }

    let resolvedPriorityId = priorityId
    if (!resolvedPriorityId) {
      const { data: medPriority, error: prioError } = await supabase
        .schema('config').from('task_priorities').select('id').eq('slug', 'med').single()
      if (prioError || !medPriority) {
        console.error('POST /api/events/[id]/planning/tasks: med priority lookup failed:', prioError)
        return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
      }
      resolvedPriorityId = medPriority.id
    }

    const { data: taskRow, error: insertError } = await supabase
      .from('event_tasks')
      .insert({
        event_id: id,
        title,
        description: description ?? null,
        due_date: dueDate ?? null,
        sub_event_id: subEventId ?? null,
        priority_id: resolvedPriorityId,
        status_id: pendingStatus.id,
      })
      .select('id, title, description, due_date, sub_event_id, priority_id, status_id')
      .single()

    if (insertError || !taskRow) {
      console.error('POST /api/events/[id]/planning/tasks failed:', insertError)
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
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
    }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
