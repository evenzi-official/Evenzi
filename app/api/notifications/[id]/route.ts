import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { uuidSchema } from '@/lib/validations/guests'

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: updatedRows, error: updateError } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id')

    if (updateError) {
      console.error('PATCH /api/notifications/[id] failed:', updateError)
      return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
    }

    if (!updatedRows || updatedRows.length === 0) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
