import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { toAppNotification, type NotificationRow } from '@/lib/types/notifications'

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limitRaw = parseInt(searchParams.get('limit') ?? '20', 10)
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 50) : 20

    const { data: rows, error: fetchError } = await supabase
      .from('notifications')
      .select('id, user_id, event_id, type, title, body, link_path, read_at, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (fetchError) {
      console.error('GET /api/notifications failed:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
    }

    const { count, error: countError } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('read_at', null)

    if (countError) {
      console.error('GET /api/notifications unread count failed:', countError)
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
    }

    const notifications = ((rows ?? []) as NotificationRow[]).map(toAppNotification)

    return NextResponse.json({ notifications, unreadCount: count ?? 0 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
