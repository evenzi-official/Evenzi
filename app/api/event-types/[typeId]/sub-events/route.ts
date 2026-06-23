import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { mapSubEventTypeRow, SubEventTypeRow } from '@/lib/types/events'

const uuidSchema = z.string().uuid()

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ typeId: string }> }
) {
  try {
    const { typeId } = await params

    const parsed = uuidSchema.safeParse(typeId)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid event type ID — must be a valid UUID' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .schema('config')
      .from('event_sub_types')
      .select('*')
      .eq('event_type_id', typeId)
      .eq('enabled', true)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('GET /api/event-types/[typeId]/sub-events error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch sub-event types' },
        { status: 500 }
      )
    }

    const subEventTypes = (data as SubEventTypeRow[]).map(mapSubEventTypeRow)

    return NextResponse.json({ subEventTypes })
  } catch (error) {
    console.error('GET /api/event-types/[typeId]/sub-events error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
