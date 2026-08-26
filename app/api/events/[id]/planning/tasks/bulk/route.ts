import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { requireEventWrite } from '@/lib/auth/eventAccess'
import { bulkTaskActionSchema, uuidSchema } from '@/lib/validations/planning'

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

    const parsed = bulkTaskActionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    if (parsed.data.action === 'complete') {
      const { error } = await supabase.rpc('bulk_set_task_status', {
        p_event_id: id,
        p_task_ids: parsed.data.taskIds,
        p_status_slug: 'completed',
      })
      if (error) {
        console.error('POST .../tasks/bulk (complete) failed:', error)
        return NextResponse.json({ error: 'Failed to complete tasks' }, { status: 500 })
      }
    } else if (parsed.data.action === 'delete') {
      const { error } = await supabase.from('event_tasks')
        .delete().eq('event_id', id).in('id', parsed.data.taskIds)
      if (error) {
        console.error('POST .../tasks/bulk (delete) failed:', error)
        return NextResponse.json({ error: 'Failed to delete tasks' }, { status: 500 })
      }
    } else if (parsed.data.action === 'setDate') {
      const { error } = await supabase.from('event_tasks')
        .update({ due_date: parsed.data.dueDate }).eq('event_id', id).in('id', parsed.data.taskIds)
      if (error) {
        console.error('POST .../tasks/bulk (setDate) failed:', error)
        return NextResponse.json({ error: 'Failed to set due date' }, { status: 500 })
      }
    } else {
      const { error } = await supabase.from('event_tasks')
        .update({ sub_event_id: parsed.data.subEventId }).eq('event_id', id).in('id', parsed.data.taskIds)
      if (error) {
        console.error('POST .../tasks/bulk (assign) failed:', error)
        return NextResponse.json({ error: 'Failed to assign sub-event' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
