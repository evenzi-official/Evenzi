import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { uuidSchema } from '@/lib/validations/guests'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; tagId: string }> }
): Promise<NextResponse> {
  try {
    const { id, tagId } = await params
    if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(tagId).success) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { error } = await supabase
      .from('event_guest_tags')
      .delete()
      .eq('id', tagId)
      .eq('event_id', id)

    if (error) {
      console.error('DELETE /api/events/[id]/guest-tags/[tagId] failed:', error)
      return NextResponse.json({ error: 'Failed to remove tag' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
