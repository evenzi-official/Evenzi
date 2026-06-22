import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { mapEventTypeRow, EventTypeRow } from '@/lib/types/events'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .schema('config')
      .from('event_types')
      .select('*')
      .eq('enabled', true)
      .order('display_order', { ascending: true })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch event types' },
        { status: 500 }
      )
    }

    const eventTypes = (data as EventTypeRow[]).map(mapEventTypeRow)

    return NextResponse.json({ eventTypes })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
